let yoshi, gorilla;
let bgImage;
let fire = [];

// Yoshi的動作
let yoshi_jump = [];
let yoshi_walk = [];
let yoshi_attack = [];

// Gorilla的動作
let gorilla_jump = [];
let gorilla_walk = [];
let gorilla_attack = [];

// 精靈圖
let yoshiJumpSheet, yoshiWalkSheet, yoshiAttackSheet;
let gorillaJumpSheet, gorillaWalkSheet, gorillaAttackSheet;
let fireEffectSheet;

// 在文件開頭添加爆炸相關變數
let explosionSheet;
let explosionAnim = [];
let explosions = [];

class Character {
  constructor(x, y, jumpAnim, walkAnim, attackAnim) {
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.jump = jumpAnim;
    this.walk = walkAnim;
    this.attack = attackAnim;
    this.currentAnim = this.walk;
    this.frameIndex = 0;
    this.frameDelay = 5;
    this.frameCount = 0;
    this.isAttacking = false;
    this.facing = 1;
    this.fireEffectIndex = 0;
    this.projectiles = [];
    this.attackCooldown = 0;
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.jumpSpeed = -15;
    this.gravity = 0.8;
    this.maxHealth = 100;    // 最大血量設為100
    this.health = 100;       // 當前血量設為100
    this.isMoving = false;  // 添加移動狀態標記
    this.damage = 20;        // 攻擊傷害
    this.isHurt = false;     // 是否受傷
    this.hurtTime = 0;       // 受傷無敵時間
  }

  update() {
    // 更新跳躍
    if (this.isJumping) {
      this.jumpVelocity += this.gravity;
      this.y += this.jumpVelocity;
      
      // 著地檢測
      if (this.y >= this.initialY) {
        this.y = this.initialY;
        this.isJumping = false;
        this.jumpVelocity = 0;
        // 跳躍結束時顯示走路動畫第一幀
        this.currentAnim = this.walk;
        this.frameIndex = 0;
      }
    }

    // 只在移動或攻擊時更新動畫幀
    if (this.isMoving || this.isAttacking) {
      this.frameCount++;
      if (this.frameCount >= this.frameDelay) {
        this.frameCount = 0;
        this.frameIndex = (this.frameIndex + 1) % this.currentAnim.length;
      }
    }

    // 更新攻擊狀態
    if (this.isAttacking) {
      if (this.frameIndex >= this.attack.length - 1) {
        this.isAttacking = false;
        this.currentAnim = this.walk;
        this.frameIndex = 0;
      }
    }

    // 更新冷卻時間
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // 更新發射物和碰撞檢測
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      let p = this.projectiles[i];
      p.x += p.speed;
      
      // 檢查是否擊中對手
      let opponent = this === yoshi ? gorilla : yoshi;
      if (this.checkHit(p, opponent)) {
        opponent.takeDamage(this.damage);
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // 移除超出畫面的發射物
      if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        this.projectiles.splice(i, 1);
      }
    }

    // 更新受傷狀態
    if (this.isHurt) {
      this.hurtTime--;
      if (this.hurtTime <= 0) {
        this.isHurt = false;
      }
    }
  }

  // 檢查發射物是否擊中目標
  checkHit(projectile, target) {
    let hitDistance = 50;  // 碰撞距離
    return abs(projectile.x - target.x) < hitDistance &&
           abs(projectile.y - target.y) < hitDistance;
  }

  // 受到傷害
  takeDamage(amount) {
    if (!this.isHurt) {
      this.health = max(0, this.health - amount);
      this.isHurt = true;
      this.hurtTime = 30;  // 無敵時間30幀
    }
  }

  display() {
    // 受傷時的閃爍效果
    push();
    if (this.isHurt && (frameCount % 4 < 2)) {
      tint(255, 0, 0);  // 受傷時紅色閃爍
    }
    
    // 繪製角色
    translate(this.x, this.y);
    scale(this.facing, 1);
    image(this.currentAnim[this.frameIndex], -32, -32,320,320);
    pop();

    // 繪製發射物
    for (let p of this.projectiles) {
      push();
      translate(p.x, p.y);
      scale(p.speed > 0 ? 1 : -1, 1);  // 根據移動方向翻轉火焰
      if (fire && fire.length > 0) {
        let fireIndex = Math.floor(frameCount/5) % fire.length;
        image(fire[fireIndex], -16, -16, 32, 32);
      }
      pop();
    }
  }

  moveLeft() {
    this.x -= 5;
    this.facing = -1;
    this.isMoving = true;
    if (!this.isAttacking) {
      this.currentAnim = this.walk;
    }
  }

  moveRight() {
    this.x += 5;
    this.facing = 1;
    this.isMoving = true;
    if (!this.isAttacking) {
      this.currentAnim = this.walk;
    }
  }

  attack() {
    if (!this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.currentAnim = this.attack;
      this.frameIndex = 0;
      
      // 創建新的發射物
      let projectile = {
        x: this.x + (this.facing > 0 ? 50 : -50),  // 根據朝向調整發射位置
        y: this.y,
        speed: 10 * this.facing,  // 根據朝向決定速度方向
        frameIndex: 0
      };
      this.projectiles.push(projectile);
      
      this.attackCooldown = 15;
    }
  }

  startJump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpSpeed;
      if (!this.isAttacking) {
        this.currentAnim = this.jump;
      }
    }
  }
}

// 添加爆炸類別
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frameIndex = 0;
    this.frameDelay = 3;
    this.frameCount = 0;
    this.finished = false;
  }

  update() {
    this.frameCount++;
    if (this.frameCount >= this.frameDelay) {
      this.frameCount = 0;
      this.frameIndex++;
      if (this.frameIndex >= explosionAnim.length) {
        this.finished = true;
      }
    }
  }

  display() {
    if (!this.finished && explosionAnim.length > 0) {
      image(explosionAnim[this.frameIndex], this.x - 32, this.y - 32);
    }
  }
}

function preload() {
  yoshiJumpSheet = loadImage('yoshi_jump.png');
  yoshiWalkSheet = loadImage('yoshi_walk.png');
  yoshiAttackSheet = loadImage('yoshi_attack.png');
  
  gorillaJumpSheet = loadImage('gorilla_jump.png');
  gorillaWalkSheet = loadImage('gorilla_walk.png');
  gorillaAttackSheet = loadImage('gorilla_attack.png');
  
  bgImage = loadImage('background.png');
  fireEffectSheet = loadImage('fire_effect.png');

}

function setupAnimation(spritesheet, array, w, h, frames) {
  for (let i = 0; i < frames; i++) {
    let img = spritesheet.get(i * w, 0, w, h);
    array.push(img);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  setupAnimation(yoshiJumpSheet, yoshi_jump, 30, 33, 7);
  setupAnimation(yoshiWalkSheet, yoshi_walk, 31, 32, 5);
  setupAnimation(yoshiAttackSheet, yoshi_attack, 14, 34, 8);
  
  setupAnimation(gorillaJumpSheet, gorilla_jump, 36, 55, 5);
  setupAnimation(gorillaWalkSheet, gorilla_walk, 52, 35, 5);
  setupAnimation(gorillaAttackSheet, gorilla_attack, 46, 36, 6);
  
  fire = setupAnimation(fireEffectSheet, [], 22, 16, 11);
  
  yoshi = new Character(width * 0.25, height * 0.75, yoshi_jump, yoshi_walk, yoshi_attack);
  gorilla = new Character(width * 0.75, height * 0.75, gorilla_jump, gorilla_walk, gorilla_attack);
  yoshi.facing = 1;    // Yoshi 面向右方
  gorilla.facing = -1; // Gorilla 面向左方
}

function draw() {
  // 繪製背景
  image(bgImage, 0, 0, width, height);
  
  // 更新和顯示角色
  yoshi.update();
  yoshi.display();
  gorilla.update();
  gorilla.display();
  
  // 玩家1（左上角）
  push();
  let x1 = 20;
  let y1 = 20;
  
  // 玩家1文字
  textSize(20);
  textAlign(LEFT, TOP);
  fill(255);
  stroke(0);
  strokeWeight(2);
  text("玩家１", x1, y1);
  text("Ａ向左　Ｗ跳躍　Ｄ向右　Ｆ攻擊", x1, y1 + 30);
  
  // 玩家1血條
  strokeWeight(2);
  stroke(0);
  // 血條背景
  fill(255, 0, 0);
  rect(x1, y1 + 70, 200, 20);
  // 當前血量
  fill(0, 255, 0);
  rect(x1, y1 + 70, (yoshi.health / 100) * 200, 20);
  // 血量數字
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  text(Math.floor(yoshi.health) + "/100", x1 + 100, y1 + 80);
  pop();
  
  // 玩家2（右上角）
  push();
  let x2 = width - 20;
  let y2 = 20;
  
  // 玩家2文字
  textSize(20);
  textAlign(RIGHT, TOP);
  fill(255);
  stroke(0);
  strokeWeight(2);
  text("玩家２", x2, y2);
  text("⭠向左　⭡跳躍　⭢向右　Ｌ攻擊", x2, y2 + 30);
  
  // 玩家2血條
  strokeWeight(2);
  stroke(0);
  // 血條背景
  fill(255, 0, 0);
  rect(x2 - 200, y2 + 70, 200, 20);
  // 當前血量
  fill(0, 255, 0);
  rect(x2 - 200, y2 + 70, (gorilla.health / 100) * 200, 20);
  // 血量數字
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  text(Math.floor(gorilla.health) + "/100", x2 - 100, y2 + 80);
  pop();
  
  // 控制Yoshi (WASD + F)
  if (keyIsDown(65)) yoshi.moveLeft();      // A
  if (keyIsDown(68)) yoshi.moveRight();     // D
  if (keyIsDown(70)) yoshi.attack();        // F
  if (keyIsDown(87)) yoshi.startJump();     // W
  
  // 控制Gorilla (方向鍵 + L)
  if (keyIsDown(LEFT_ARROW)) gorilla.moveLeft();
  if (keyIsDown(RIGHT_ARROW)) gorilla.moveRight();
  if (keyIsDown(76)) gorilla.attack();      // L
  if (keyIsDown(UP_ARROW)) gorilla.startJump();
}

function keyReleased() {
  if (keyCode === 65 || keyCode === 68) {  // A 或 D
    yoshi.isMoving = false;
    if (!yoshi.isAttacking && !yoshi.isJumping) {
      yoshi.currentAnim = yoshi.walk;
      yoshi.frameIndex = 0;
    }
  }
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    gorilla.isMoving = false;
    if (!gorilla.isAttacking && !gorilla.isJumping) {
      gorilla.currentAnim = gorilla.walk;
      gorilla.frameIndex = 0;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (yoshi) {
    yoshi.x = width * 0.25;
    yoshi.y = height * 0.75;
    yoshi.initialY = yoshi.y;
    yoshi.facing = 1;  // 保持 Yoshi 面向右方
  }
  if (gorilla) {
    gorilla.x = width * 0.75;
    gorilla.y = height * 0.75;
    gorilla.initialY = gorilla.y;
    gorilla.facing = -1;  // 保持 Gorilla 面向左方
  }
}

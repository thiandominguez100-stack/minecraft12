const EYE_HEIGHT=1.62;
const PLAYER_HEIGHT=1.8;
const PLAYER_RADIUS=.29;
const approach=(value,target,amount)=>value<target?Math.min(value+amount,target):Math.max(value-amount,target);

export class FirstPersonPhysics{
  constructor(){this.onGround=false;this.jumpBuffer=0;this.inWater=false;this.submersion=0;}
  reset(){this.onGround=false;this.jumpBuffer=0;this.inWater=false;this.submersion=0;}
  queueJump(){this.jumpBuffer=.2;}
  update(world,position,velocity,controls,dt){
    dt=Math.max(0,Math.min(.05,Number(dt)||0));
    this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    let support=world.findGroundSurface(position,PLAYER_RADIUS,.12);
    if(this.onGround){
      if(support===null)this.onGround=false;
      else{position.y=support+EYE_HEIGHT;if(velocity.y<0)velocity.y=0;}
    }else if(velocity.y<=0&&support!==null){
      position.y=support+EYE_HEIGHT;velocity.y=0;this.onGround=true;
    }
    if(this.jumpBuffer>0&&this.onGround){
      velocity.y=8.8;this.onGround=false;this.jumpBuffer=0;
    }

    let inputX=Number(controls.x)||0,inputZ=Number(controls.z)||0;
    const inputLength=Math.hypot(inputX,inputZ);
    if(inputLength>1){inputX/=inputLength;inputZ/=inputLength;}
    const speed=Math.max(0,Number(controls.speed)||0);
    this.submersion=world.getSubmersion?world.getSubmersion(position,PLAYER_RADIUS,PLAYER_HEIGHT):0;
    this.inWater=this.submersion>.035;
    if(this.inWater){
      this.onGround=false;this.jumpBuffer=0;
      const swimSpeed=Math.min(speed,controls.sprint?4.1:3.35);
      const targetSwimX=inputX*swimSpeed,targetSwimZ=inputZ*swimSpeed;
      velocity.x=approach(velocity.x,inputLength>0?targetSwimX:0,(inputLength>0?9:2.8)*dt);
      velocity.z=approach(velocity.z,inputLength>0?targetSwimZ:0,(inputLength>0?9:2.8)*dt);
      velocity.y+=(-3.5+this.submersion*8)*dt;
      velocity.y*=Math.exp(-2.4*dt);
      if(controls.jump)velocity.y=Math.min(4.8,velocity.y+11*dt);

      const swimX=velocity.x*dt,swimZ=velocity.z*dt;
      const swimSteps=Math.max(1,Math.ceil(Math.max(Math.abs(swimX),Math.abs(swimZ))/.075));
      for(let i=0;i<swimSteps;i++){
        const oldX=position.x;position.x+=swimX/swimSteps;
        if(world.collides(position,PLAYER_RADIUS,PLAYER_HEIGHT)){position.x=oldX;velocity.x=0;}
        const oldZ=position.z;position.z+=swimZ/swimSteps;
        if(world.collides(position,PLAYER_RADIUS,PLAYER_HEIGHT)){position.z=oldZ;velocity.z=0;}
      }
      const swimY=velocity.y*dt,verticalSwimSteps=Math.max(1,Math.ceil(Math.abs(swimY)/.045));
      for(let i=0;i<verticalSwimSteps;i++){
        const oldY=position.y;position.y+=swimY/verticalSwimSteps;
        if(world.collides(position,PLAYER_RADIUS,PLAYER_HEIGHT)){position.y=oldY;velocity.y=0;break;}
      }
      return this;
    }
    const targetX=inputX*speed,targetZ=inputZ*speed;
    const acceleration=this.onGround?34:11,friction=this.onGround?22:2.4;
    velocity.x=approach(velocity.x,inputLength>0?targetX:0,(inputLength>0?acceleration:friction)*dt);
    velocity.z=approach(velocity.z,inputLength>0?targetZ:0,(inputLength>0?acceleration:friction)*dt);

    const moveX=velocity.x*dt,moveZ=velocity.z*dt;
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(moveX),Math.abs(moveZ))/.075));
    for(let i=0;i<steps;i++){
      const oldX=position.x;position.x+=moveX/steps;
      if(world.collides(position,PLAYER_RADIUS,PLAYER_HEIGHT)){position.x=oldX;velocity.x=0;}
      const oldZ=position.z;position.z+=moveZ/steps;
      if(world.collides(position,PLAYER_RADIUS,PLAYER_HEIGHT)){position.z=oldZ;velocity.z=0;}
    }

    if(this.onGround){
      support=world.findGroundSurface(position,PLAYER_RADIUS,.12);
      if(support===null)this.onGround=false;
      else position.y=support+EYE_HEIGHT;
    }
    if(!this.onGround){
      velocity.y-=24*dt;
      const moveY=velocity.y*dt,verticalSteps=Math.max(1,Math.ceil(Math.abs(moveY)/.045));
      for(let i=0;i<verticalSteps;i++){
        const oldY=position.y;position.y+=moveY/verticalSteps;
        if(world.collides(position,PLAYER_RADIUS,PLAYER_HEIGHT)){
          if(moveY<0){
            support=world.findGroundSurface(position,PLAYER_RADIUS,.32,.16);
            if(support!==null){position.y=support+EYE_HEIGHT;velocity.y=0;this.onGround=true;}
            else{position.y=oldY;velocity.y=0;}
          }else{position.y=oldY;velocity.y=0;}
          break;
        }
      }
      if(!this.onGround&&velocity.y<=0){
        support=world.findGroundSurface(position,PLAYER_RADIUS,.10);
        if(support!==null){position.y=support+EYE_HEIGHT;velocity.y=0;this.onGround=true;}
      }
    }else velocity.y=0;
    return this;
  }
}

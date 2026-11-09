import {ITEM_MAP,RECIPES} from "./data.js";

export class Inventory{
  constructor(mode="survival"){this.slots=Array.from({length:36},()=>null);this.selected=0;this.mode=mode;}
  get selectedStack(){return this.slots[this.selected]}
  setMode(mode){this.mode=mode}
  count(id){return this.slots.reduce((n,s)=>n+(s?.id===id?s.count:0),0)}
  has(ingredients){return Object.entries(ingredients).every(([id,n])=>this.count(id)>=n)}
  canFit(id,count=1){
    const def=ITEM_MAP[id];if(!def||count<=0)return false;
    if(this.mode==="creative")return true;
    const max=def.stack||64;
    let free=0;
    for(const slot of this.slots){
      if(slot?.id===id)free+=Math.max(0,max-slot.count);
      else if(!slot)free+=max;
      if(free>=count)return true;
    }
    return false;
  }
  add(id,count=1,meta={}){
    if(!ITEM_MAP[id]||count<=0)return count;
    if(this.mode==="creative")return 0;
    let left=count,def=ITEM_MAP[id],max=def.stack||64;
    for(let i=0;i<this.slots.length&&left>0;i++){let s=this.slots[i];if(s?.id===id&&s.count<max){let n=Math.min(left,max-s.count);s.count+=n;left-=n}}
    for(let i=0;i<this.slots.length&&left>0;i++)if(!this.slots[i]){let n=Math.min(left,max);this.slots[i]={id,count:n,...(def.kind==="tool"?{durability:meta.durability??def.durability}: {})};left-=n}
    return left;
  }
  remove(id,count=1){
    if(this.mode==="creative")return true;
    if(this.count(id)<count)return false;
    let left=count;for(let i=this.slots.length-1;i>=0&&left>0;i--){let s=this.slots[i];if(s?.id===id){let n=Math.min(left,s.count);s.count-=n;left-=n;if(!s.count)this.slots[i]=null}}
    return true;
  }
  consumeSelected(){
    if(this.mode==="creative")return true;let s=this.selectedStack;if(!s)return false;s.count--;if(s.count<=0)this.slots[this.selected]=null;return true;
  }
  damageSelected(amount=1){
    if(this.mode==="creative")return;let s=this.selectedStack,def=s&&ITEM_MAP[s.id];if(!def||def.kind!=="tool")return;
    s.durability=(s.durability??def.durability)-amount;if(s.durability<=0)this.slots[this.selected]=null;
  }
  craft(recipeId){
    const recipe=RECIPES.find(r=>r.id===recipeId);if(!recipe)return {ok:false,message:"Receta no encontrada."};
    if(recipe.station==="table"&&!this.has({crafting_table:1}))return {ok:false,message:"Necesitas una mesa de trabajo en tu inventario."};
    if(!this.has(recipe.in))return {ok:false,message:"No tienes todos los materiales."};
    if(this.mode!=="creative")for(const [id,n] of Object.entries(recipe.in))this.remove(id,n);
    const previousMode=this.mode;this.mode="survival";for(const [id,n] of Object.entries(recipe.out))this.add(id,n);this.mode=previousMode;
    return {ok:true,message:"Fabricado: "+recipe.name};
  }
  serialize(){return this.slots.map(s=>s?{...s}:null)}
  restore(slots){if(Array.isArray(slots))this.slots=Array.from({length:36},(_,i)=>slots[i]?{...slots[i]}:null)}
}

import { HtmlElement } from "./tool";
import { TElement,Br,Link_space,Char } from "./telement";

export class InputBox{
    constructor(tmodel,element_obj){
        this.tmodel=tmodel;
        this.padding=[5,5];   //上下 左右
        this.index=0;               //輸入位置
        this.selecting=[0,0];      //起始，終點
        this.telements=[];
        //------------------------------------------------------------------------element_obj屬性
        element_obj.style=`padding:${this.padding[0]}px ${this.padding[1]}px;cursor:text;background-color:white`;
        element_obj.innerHTML='<div style="user-select: none;"></div>';
        this.displayer=element_obj.firstChild;           //顯示器
        //-------------------------------------------------------------------------輸入物件
        let inp=HtmlElement('input',"position:absolute;width:1px;background-color:transparent;outline:none;border:transparent;");
        let _inp=HtmlElement('span',"color:black;display:inline-block;");        
        //--------------------------------------------------------------------------點擊事件
        this.events={};
        let events=this.events;
        element_obj.onmousedown=function (event){
            if(events['onmousedown']) events['onmousedown'](event);
        };
        element_obj.onmousemove=function (event){
            
        };
        element_obj.onmouseup=function (event){
            
        };
        element_obj.onclick=function (event){
            
        };
        element_obj.ondblclick=function (event){
            
        };
        //---------------------------------------------------------------------------輸入事件
        inp.addEventListener('paste', function (event) {
        });
        inp.addEventListener('keydown', function (event) {
        });
        inp.addEventListener('input', function (event) {
        });
        inp.addEventListener('keyup', function (event) {
        });
    }
    add_event(eventname,_function){
        this.events[eventname]=_function;
    }
    mousetap(event){
        let rect=this.displayer.getBoundingClientRect();
        let pos=[event.clientX-rect.left,event.clientY-rect.top];
        return this.tap(pos);
    }
    tap(pos){
        let x=pos[0];
        let y=pos[1];
        this.remove_inp();
        let fit_y=[null,null];        //y座標符合且最接近的,分數
        //------------------------------先找到最接近y
        let telements=this.telements;
        if(telements.length==0)
            return 0;
        if(y<telements[0].get_rect()[1]){
            //console.log('第一元素:'+telements[0].get_rect());
            return 0;
        }
        for(let i=0;i<telements.length;i++){
            let telement=telements[i];
            if (telement.type=='br'){
                continue;
            }
            let rect=telement.get_rect();
            if(y>=rect[1] && y<rect[1]+rect[3]){     //代表y符合
                if(x>=rect[0] && x<rect[0]+rect[2]){     //代表x符合
                    if(get_telement)
                        return telement;
                    if(is_selected && i>=this.selecting[0] && i<this.selecting[1])
                        return 'yes';
                    if(x>rect[0]+rect[2]/2)
                        return i+1;
                    return i;
                }
                let score=Math.abs(x-(rect[0]+rect[2]/2));
                if (fit_y[1]==null || score<fit_y[1]){
                    if(x>rect[0]+rect[2]/2)
                        fit_y=[i+1,score];
                    else fit_y=[i,score];
                }
            }
        }
        if(fit_y[0]!=null)
            return fit_y[0];
        return telements.length;
    }
    remove_inp(){
        if(this.displayer.contains(this.inp))
            this.displayer.removeChild(this.inp);
        if(this.displayer.contains(this._inp))
            this.displayer.removeChild(this._inp);
    }
    show_inp(){
        this.remove_inp();
        let inp=this.inp;
        let fontSize=this.get_text_dict()['fontSize'];
        if(this.index==0){
            if(this.telements.length==0){
                this.displayer.appendChild(this._inp);
                inp.style.top=Math.round(this.padding[1]+fontSize/16)+'px';
            }else{
                let c=this.displayer.firstChild;
                this.displayer.insertBefore(this._inp,c);
                inp.style.top=Math.round(c.offsetTop+c.offsetHeight/16)+'px';
            }
            let rect=this.displayer.getBoundingClientRect();
            inp.style.left=this._inp.offsetLeft+'px';
            //inp.style.left=rect.left+this.padding[0]+'px';
            inp.style.fontSize=fontSize+'px';
        }else{
            let c=this.displayer.children[this.index-1];
            if(c.tagName=='BR'){
                this.index++;
                c=this.displayer.children[this.index-1];
            }
            //console.log('前一個高:'+c.offsetHeight);
            c.after(this._inp);
            inp.style.left=(c.offsetLeft+c.offsetWidth-2)+'px';
            
            inp.style.top=Math.round(c.offsetTop+c.offsetHeight/16)+'px';
            inp.style.fontSize= Math.round(c.offsetHeight*3/4)+'px';
        }
        this._inp.style.fontSize=fontSize+'px';
        this.displayer.style.minHeight=Math.round(fontSize*4/3)+'px';
        this.displayer.appendChild(inp);
        inp.focus();
    }
    change_line(){
        this.insert_telement({'type':'br'});
        let build_dict=copy_dict(this.text_dict);
        build_dict['type']='br_space';
        build_dict['fontSize']=this.get_dict(this.input_mode[0])['fontSize'];
        this.insert_telement(build_dict);
    }
    insert_telement(telement){
        
    }





}
import { body } from "./base.js";

function vchange(v){
    let v2=[v[0],v[1]];
    if(typeof v[0]=="number") v2[0]+='px';
    if(typeof v[1]=="number") v2[1]+='px';
    return v2;
}
/*
功能: Style 、滑鼠點擊、顯示隱藏、調整座標、大小
不接受: hover 
 */
export class BaseSimple{                           //所有面板元素的基礎基底
    constructor(tag='div',parent=-1,pos=null,size=null,_style=null){
        if(pos==null) pos=['0px','0px'];
        pos=vchange(pos);
        if(size==null) size=['auto','auto'];
        size=vchange(size);
        this._style={'position':'absolute','left':pos[0],'top':pos[1],'width':size[0],'height':size[1]};
        //-----------------------------------------------------------------------
        let _element=document.createElement(tag);
        this._element=_element;
        //---------------------------------------父層依賴
        if(parent==-1) parent=body;
        parent.appendChild(this);
        this.parent=parent;
        this.events={   //[[id,func],...]
            'onmousedown':[],'onmousemove':[],'onmouseup':[],'onclick':[],
            'show':[],'hide':[],'destroy':[],'resize':[]
        };
        //---------------------------狀態屬性
        this.pos=[0,0];      //及時更新
        this.size=[0,0];     //及時更新
        this.scale=null;     //默認 縮放(以中心為中點)
        this._enable=true;
        this.showing=true;
        this.alpha=1;       //透明度
        this.setStyle(_style);
        this.anime=null;      //當前動畫
        //---------------------------hover
        this.hover_style=null;
        //---------------------------------------
        this.children=[];
        this.type='base';
        this.base='base';     //繼承基底
    }
    //----------------------------------------------------------------------------document element基本功能
    appendChild(child){
        this.children.push(child);
        this._element.appendChild(child._element);
        this.updateRect();
    }
    removeChild(child){
        ArrayRemove(this.children,child);
        this._element.removeChild(child._element);
    }
    addEventListener(eventname,callback){
        this._element.addEventListener(eventname,callback);
    }
    setInnerHTML(html){
        this._element.innerHTML=html;
        this.updateRect();
    }
    getInnerHTML(){
        return this._element.innerHTML;
    }
    //----------------------------------------------------------------------------外觀
    _updateAttr(){
        let c=this._element;
        this.pos=[c.offsetLeft,c.offsetTop];
        this.size=[c.offsetWidth,c.offsetHeight];
    }
    updateRect(){    //更新狀態
        this.setStyle({'left':this._style['left'],'top':this._style['top'],
            'width':this._style['width'],'height':this._style['height']});
    }
    setStyle(_style=null,update_style=true){
        function change_percent(key){
            if(_style[key]){
                let v=_style[key];
                if(v.slice(-1)=='%'){
                    let p=parseInt(v.substring(0,v.length-1))/100;
                    if(key=='left') style[key]=parent.size[0]*p+'px';
                    if(key=='top') style[key]=parent.size[1]*p+'px';
                    if(key=='width') style[key]=parent.size[0]*p+'px';
                    if(key=='height') style[key]=parent.size[1]*p+'px';
                }
            }
        }
        let parent=this.parent;
        if(_style==null) _style={};
        if(update_style) Object.assign(this._style,_style);
        let style=copy_dict(this._style);

        if(style['position']=='fixed'){
            let frame=this.getFrame();
            if(this.parent!=frame)
                this.setParent(frame);
            style['position']='absolute';
        }
        if(this.parent!=-1){
            for(let i=0;i<4;i++){
                let key=['left','top','width','height'][i];
                change_percent(key);
            }
        }
        
        //------------------------------------------顯示與隱藏
        if(_style['visibility']){
            if(_style['visibility']=='hidden') this.showing=false;
            else this.showing=true;
        }
        //------------------------------------------
        this._element.style=styleString(style);
        //-------------------------------------------更新常用屬性
        this._updateAttr();
        //--------------------------------------------子元素更新
        if(_style['width'] || _style['height']){
            for(let i=0;i<this.children.length;i++){
                let child=this.children[i];
                if(child.base=='base'){
                    if(child._style['left'].slice(-1)=='%' || child._style['top'].slice(-1)=='%' || 
                       child._style['width'].slice(-1)=='%' || child._style['height'].slice(-1)=='%')
                        child.updateRect();
                }
            }
            this.trigger_event('resize',this.size);
        }
        if(_style['opacity']) this.alpha=parseFloat(_style['opacity']);
    }
    setTemStyle(_style){
        this.setStyle(_style,false);
    }
    //------------------------------------------------------------------顯示隱藏
    show(pos=null){
        if(!this.showing || pos!=null){
            let _style={'visibility':'visibile'};
            if(pos!=null){
                pos=vchange(pos);
                _style['left']=pos[0];_style['top']=pos[1];
            }
            this.setStyle(_style);
        }
        this.trigger_event('show');
    }
    hide(){
        if(this.showing) this.setStyle({'visibility':'hidden'});
        this.trigger_event('hide');
    }
    //------------------------------------------------------------------各種rect
    getrect(){
        return [this.pos[0],this.pos[1],this.size[0],this.size[1]];
    }
    getabsrect(){
        let abspos=this.getAbsPos();
        return [abspos[0],abspos[1],this.size[0],this.size[1]];
    }
    setrect([x,y,w,h],_style=null){
        if(typeof x=='number') x+='px';
        if(typeof y=='number') y+='px';
        if(typeof w=='number') w+='px';
        if(typeof h=='number') h+='px';
        let style={'left':x,'top':y,'width':w,'height':h};
        if(_style!=null) Object.assign(style,_style);
        this.setStyle(style);
    }
    //-----------------------------------------------------------座標
    getAbsPos(){        //取得絕對座標
        let rect=this._element.getBoundingClientRect();
        return [rect.left,rect.top];
    }
    setAbsPos(abspos){   //設定絕對座標
        let apos=this.parent.getAbsPos();
        this.setPos([abspos[0]-apos[0],abspos[1]-apos[1]]);
    }
    setAbsX(absx){
        let apos=this.parent.getAbsPos();this.setX(absx-apos[0]);
    }
    setAbsY(absy){
        let apos=this.parent.getAbsPos();this.setY(absy-apos[1]);
    }
    //-----------------------------------------------------------相對座標
    setX(x){
        if(typeof x=='number') x+='px';
        this.setStyle({'left':x});
    }
    setY(y){
        if(typeof y=='number') y+='px';
        this.setStyle({'top':y});
    }
    getCenter(){
        return [this.pos[0]+this.size[0]/2,this.pos[1]+this.size[1]/2];
    }
    setPos(pos){
        pos=vchange(pos);
        this.setStyle({'left':pos[0],'top':pos[1]});
    }
    move(offset){
        let pos=[this._element.offsetLeft+offset[0],this._element.offsetTop+offset[1]];
        this.setPos(pos);
    }
    setAlign(hr=null,vr=null){    //設定自身置於相對於父元素的位置
        let p=this.parent;
        let _style={};
        if(hr!=null) _style['left']=(p.size[0]-this.size[0])*{'left':0,'center':0.5,'right':1}[hr]+'px';
        if(vr!=null) _style['top']=(p.size[1]-this.size[1])*{'top':0,'center':0.5,'bottom':1}[vr]+'px';
        this.setStyle(_style);
    }
    //------------------------------------------------------------------尺寸
    //-----------------------------------------------------------實際
    setWidth(width){
        if(typeof width=='number') width+='px';
        this.setStyle({'width':width});
    }
    setHeight(height){
        if(typeof height=='number') height+='px';
        this.setStyle({'height':height});
    }
    setSize(size,_style=null){
        size=vchange(size);
        let style={'width':size[0],'height':size[1]};
        if(_style!=null) Object.assign(style,_style);
        this.setStyle(style);
    }
    //-----------------------------------------------------------比率
    setWidthRate(wrate){
        if(this.scale==null) this.setSizeRate([wrate,1]);
        else this.setSizeRate([wrate,this.scale[1]]);
    }
    setHeightRate(wrate){
        if(this.scale==null) this.setSizeRate([wrate,1]);
        else this.setSizeRate([wrate,this.scale[1]]);
    }
    setSizeRate(srate){
        this.scale=srate;
        this.setStyle({'transform':`scale(${srate[0]},${srate[1]})`})
    }
    //------------------------------------------------------------------顏色
    setBg(color){
        this.setStyle({'background-color':color});
    }
    setColor(color){
        this.setStyle({'color':color});
    }
    setAlpha(alpha){
        this.setStyle({'opacity':alpha});
    }
    //------------------------------------------------------------------層
    setLayer(layer){
        this.setStyle({'z-index':layer});
    }
    getLayer(){
        if(this._style['z-index']) return this._style['z-index'];
        return 0;
    }
    //fixedSize(){
    //    this.setSize([this._element.offsetWidth,this._element.offsetHeight]);
    //}
    
    //fitContent(){       //用於相容innerHTML
    //    if(this.children.length>0){
    //        let size=[this._element.offsetWidth,this._element.offsetHeight];
    //        for(let i=0;i<this.children.length;i++){
    //            let rect=this.children[i].getrect();
    //            size[0]=Math.max(size[0],rect[0]+rect[2]);
    //            size[1]=Math.max(size[1],rect[1]+rect[3]);
    //        }
    //        let _style={};
    //        let w=this._style['width'];
    //        let h=this._style['height'];
    //        if(w[w.length-1]=='x') _style['width']=size[0]+'px';
    //        if(h[h.length-1]=='x') _style['height']=size[1]+'px';
    //        this.setStyle(_style);
    //    }
    //    if(this.parent!=-1 && this.parent.type!='frame') this.parent.fitContent();
    //} 
    //----------------------------------------------------------------------------父層依賴
    setParent(parent){
        this._disableHover();
        this.parent.removeChild(this);
        parent.appendChild(this);
        this.parent=parent;
        this._enableHover();
    }
    getFrame(){             //回傳其「頂層依賴」，type為Frame或parent為-1的物件
        if(this.parent==-1) return this;
        let parent=this.parent;
        while (parent.type!='frame' && parent.parent!=-1) parent=parent.parent;
        return parent;
    }
    getParents(){         //取得所有祖輩元素
        if(this.parent==-1) return [];
        let parents=this.parent.getParents();
        parents.push(this.parent);
        return parents;
    }
    //----------------------------------------------------------------------------事件
    trigger_event(eventname,event){
        let events=this.events[eventname];
        for(let i=0;i<events.length;i++)
            events[i][1](event);
    }
    newEvent(eventnameList,addEventListener=true){     //添加新事件集
        if(typeof eventnameList=="string") eventnameList=[eventnameList];
        let base=this;
        for(let i=0;i<eventnameList.length;i++){
            let eventname=eventnameList[i];
            if(addEventListener && this.events[eventname]==undefined){
                this._element.addEventListener(eventname,function (event){
                    base.trigger_event(eventname,event);
                });
            }
            this.events[eventname]=[];
        }
    }
    addEvent(eventname,callback,id=null){
        this.events[eventname].push([id,callback]);
        if(this.events[eventname].length==1){
            let base=this;
            switch(eventname){
                case 'onmousedown':
                    this._element.onmousedown=(event)=>{base.trigger_event('onmousedown',event);};break;
                case 'onmousemove':
                    this._element.onmousemove=(event)=>{base.trigger_event('onmousemove',event);};break;
                case 'onmouseup':
                    this._element.onmouseup=(event)=>{base.trigger_event('onmouseup',event);};break;
                case 'onclick':
                    this._element.onclick=(event)=>{base.trigger_event('onclick',event);};break;
            }
        }
    }
    delEvent(eventname,id=null,callback=null,all=false){
        let events=this.events[eventname];
        let nevents=events;
        for(let i=0;i<events.length;i++){
            let event=events[i];
            if(event[0]==id && (callback==null || callback==event[1])){
                nevents=ArrayFilter(events,event);
                if(!all) break;
            }
        }
        this.events[eventname]=nevents;
    }
    setEvent(eventname,callback,id){
        this.delEvent(eventname,id,null,true);
        this.addEvent(eventname,callback,id);
    }
    stopPropagation(eventname){
        this.addEvent(eventname,(event)=>{event.stopPropagation();});
    }
    enable(_enable){
        this._enable=_enable;
        this._element.disabled=!_enable;
        //if(_enable){
        //    //this.setStyle();
        //}else{
        //    //let hstyle=copy_dict(this._style);
        //    //Object.assign(hstyle,{'color':'#cccccc'});
        //    //this._element.style=styleString(hstyle);
        //}
    }
    //----------------------------------------------------------------------------hover
    _enableHover(){      // hover只在該frame中有效
        let base=this;
        let set_hoverstyle=false;
        let hovering=false;
        this.addEvent('onmousemove',(event)=>{
            if(base._enable){
                hovering=true;
                if(!set_hoverstyle){
                    if(base.hover_style!=null){
                        let hstyle=copy_dict(base._style);
                        Object.assign(hstyle,base.hover_style);
                        base._element.style=styleString(hstyle);
                    }
                    if(base.hover_event!=undefined && base.hover_event!=null)
                        base.hover_event(event);
                    set_hoverstyle=true;
                }
            }
        },'myhover');
        if(this.hover_domain==null) this.hover_domain=this.getFrame();
        this.hover_domain.addEvent('onmousemove',(event)=>{
            if(hovering){
                hovering=false;
            }else if(set_hoverstyle){
                base.setStyle();
                set_hoverstyle=false;
            }
        },this.id+'_hoverDomain');
    }
    _disableHover(){
        this.delEvent('onmousemove','myhover');
        if(![null,undefined].includes(this.hover_domain))
            this.hover_domain.delEvent('onmousemove',this.id+'_hoverDomain');
        this.hover_domain=null;
    }
    setHover(_style=null,hover_event=null,hover_domain=null){
        this._disableHover();
        if(_style==null) _style={};
        this.hover_style=_style;
        this.hover_event=hover_event;
        this.hover_domain=hover_domain;
        this._enableHover();
    }
    //----------------------------------------------------------------------------右鍵選單
    bindContextMenu(contextmenu,name){
        let frame=this.getFrame();
        frame.addContextMenu(contextmenu);
        let base=this;
        this._element.addEventListener('contextmenu', function(event){
            if(base._enable)
                contextmenu.show(name,event);
        });
    }
    //----------------------------------------------------------------------------全螢幕
    FullScreen(){
        this._element.requestFullscreen();
    }
    //----------------------------------------------------------------------------動畫
    runAnime(anime_style,times,animeFunc=null){
        let anime=new Anime(AnimeFunc(this,anime_style,animeFunc),times);
        this.anime=anime;
        body.addAnime(anime);
        anime.start();
    }
    //----------------------------------------------------------------------------銷毀
    destroy(){
        //------------------------------刪除所有children
        while(this.children.length>0){
            this.children[0].destroy();
        }
        this.trigger_event('destroy');
        //-------------------------------清空自身事件
        for(let [eventname,callback] of Object.entries(this.events)){
            this.events[eventname]=[];
        }
        this.parent.removeChild(this);
    }
}
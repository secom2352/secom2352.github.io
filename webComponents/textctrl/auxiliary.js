import {Button, defaultStyle, Label, Panel, Select} from "../ui/base.js";

class SelectionBox extends Panel{
    constructor(tcontrol,monitorType,size,_style=null){
        super(tcontrol.parent,null,size,_style);
        this.tcontrol=tcontrol;
        this.monitorType=monitorType;
        this.monitorFuncs=[];
        this.nowTeObjs=[];
    }
    deploy(describeList){
        for(let i=0;i<describeList.length;i++){
            //[base_class, label, pos, 監控函數(telement)=>{return true、false、值}, 變更函數(telement,value)=>{}]
            let db=describeList[i];
            switch (db[0]){
                case 'label':
                    let label=new Label(this,db[1],db[2]);
                    break;
                case 'btn':
                    let btn=new Button(this,db[1],(event)=>{
                        let isTrue=btn._style['background-color']=='#cccccc';
                        for(let i=0;i<this.nowTeObjs.length;i++){
                            db[4](this.nowTeObjs[i],!isTrue);
                        }
                        this.tcontrol.nowtblock.arrange();
                        if(isTrue) btn.setBg('transparent');
                        else btn.setBg('#cccccc');
                    },db[2],[25,25],{'cursor':'pointer','border-radius':'2px','border':'1px solid'});
                    this.monitorFuncs.push([btn,db[3]]);
                    break;
                case 'select':
                    let select=new Select(this,db[1],(value)=>{
                        for(let i=0;i<this.nowTeObjs.length;i++){
                            db[4](this.nowTeObjs[i],value);
                        }
                        this.tcontrol.nowtblock.arrange();
                    },db[2]);
                    this.monitorFuncs.push([select,db[3]]);
                    break;
            }
        }
    }
    show(){
        //-------------------------------------------------------取出 要處理的物件
        this.nowTeObjs=[];
        let relObjs=this.tcontrol.nowtblock.getSelection();
        for(let i=0;i<relObjs.length;i++){
            if(relObjs[i].type==this.monitorType) this.nowTeObjs.push(relObjs[i]);
        }
        //--------------------------------------------------------
        super.show();
        for(let i=0;i<this.monitorFuncs.length;i++){
            let mf=this.monitorFuncs[i];  //[物件,監控函數]
            //-----------------------------------------------取得監控(當前)值
            let value=null;    // null 代表沒有特定值
            for(let i=0;i<this.nowTeObjs.length;i++){
                let teObj=this.nowTeObjs[i];
                if(value==null) value=mf[1](teObj);
                else if (value!=mf[1](teObj)){
                    value=null;
                    break;
                }
            }
            //----------------------------------------------
            if(mf[0].type=='button'){
                if(value==true) mf[0].setBg('#cccccc');
                else mf[0].setBg('transparent');
            }else if(mf[0].type=='select'){
                mf[0].setValue(value);
            }
        }
    }
}

export class SbControl{
    constructor(tcontrol){
        this.tcontrol=tcontrol;
        this.sbs={};
    }
    newSelectionBox(dealType,describeList,size,_style=null){
        if(this.sbs[dealType]) return null;
        _style=defaultStyle(_style,{'cursor':'context-menu','background-color':'white',
            'padding':'2px','border':'1px solid','border-radius':'5px','z-index':'1'});
        let sb=new SelectionBox(this.tcontrol,dealType,size,_style);
        sb.deploy(describeList);
        sb.setHover({'opacity':'1'});
        sb.hide();
        //----------------------------------------
        this.sbs[dealType]=sb;
        return sb;
    }
    showSelectionBox(dealType,event){
        let sb=this.sbs[dealType];
        sb.setAbsPos([Math.max(Math.min(event.clientX-sb.size[0]/3,screen.width-sb.size[0]),20),
                         Math.min(event.clientY+20,screen.height-sb.size[1])]);
        sb.show();
        sb.setAlpha(0.2);
        //for(let i=0;i<panel.children.length;i++){
        //    panel.children[i].setAlpha(50);
        //}
    }
    hide(){
        for(const [sbName,sb] of Object.entries(this.sbs)){
            sb.hide();
        }
    }
}


export class SelectionBox2{
    constructor(tcontrol){
        this.tcontrol=tcontrol;
        let menu=HtmlElement('div',"visibility:hidden;cursor:context-menu;width: 280px;height: 35px;background-color: white;position:absolute;padding:2px;display: inline-block;border:1px solid;border-radius:5px;");
        menu.classList.add("textctrlSB");
        //add_css('.textctrlSB button:hover {background-color:beige;}');
        document.body.appendChild(menu);
        this.menu=menu;
        this.set_panel([280,35],[
            ['btn','<b>B</b>',[5,3],'B'],
            ['btn','<i>I</i>',[37,3],'I'],
            ['btn','<u>U</u>',[69,3],'U'],
            ['btn','<s>S</s>',[101,3],'S'],
            ['select',[8,9,10,11,12,14,18,24,30,36,48,60,72,96],[143,10],'fontSize'],
            ['cbtn','A',[193,3],'color'],
            ['cbtn2','bg',[237,3],'bgcolor'],
        ]);
        this.enable=true;
        this.set_panel([125,60],[
            ['label','w:',[5,5]],
            ['select',[1,2,3,4,5,6,7],[28,5],'esc_w'],
            ['label','h:',[72,5]],
            ['select',[1,2,3,4,5,6,7],[90,5],'esc_h'],
            ['btn','<b>B</b>',[5,33],'B',[25,25]],
            ['btn','<u>U</u>',[30,33],'U',[25,25]],
            ['select',['Font A','Font B'],[60,35],'esc_font',{'Font A':'0','Font B':'1'}],
        ]);
        this.set_zoom(1.2);
    }
    set_zoom(zoom){
        this.menu.style.transform=`scale(${zoom},${zoom})`;
        this.zoom=zoom;
    }
    reset(size){              //清空面板並調整大小
        this.menu.innerHTML='';
        this.menu.style.width=size[0]+'px';
        this.menu.style.height=size[1]+'px';
    }
    //用來添加某屬性，且該屬性的值只有0或1
    add_btn(label,pos,attrname,size=[32,32]){
        let sb=this;
        let btn=HtmlElement('button','position:absolute;cursor:pointer;border-radius:2px;background-color:transparent;border:1px solid;',label);
        btn.style.width=size[0]+'px';btn.style.height=size[1]+'px';
        btn.style.left=pos[0]+'px';btn.style.top=pos[1]+'px';
        btn.v=0;
        btn.onclick=function (event){
            btn.v=[1,0][btn.v];
            sb.set_attr(attrname,btn.v+'');
        }
        btn.onmousemove=function (event){btn.backgroundColor='beige';}
        btn.render_status=[attrname,function (value){
            if(parseInt(value)==1) btn.style.backgroundColor='#cccccc';
            else btn.style.backgroundColor='transparent';
        }];
        this.menu.appendChild(btn);
    }
    //設定某屬性，且該屬性的值為顏色，顏色提示顯示在字下方
    add_cbtn(label,pos,attrname){
        let sb=this;
        let color_btn=HtmlElement('button',"position:absolute;width:40px;height:32px;background-color:transparent;",label+'<div style="width:25px;height:5px;background-color:red;border:1px solid;"></div>');
        color_btn.style.left=pos[0]+'px';color_btn.style.top=pos[1]+'px';
        let color_input=HtmlElement('input',"visibility:hidden;position:absolute;");
        color_input.type='color';
        color_btn.onclick=function (event){
            color_input.style.left=this.offsetLeft+'px';
            color_input.style.top=(this.offsetTop+16)+'px';
            color_input.click();
        };
        color_btn.onmousemove=function (event){color_btn.backgroundColor='beige';}
        color_input.addEventListener('input',(event)=>{
            color_btn.children[0].style.backgroundColor=color_input.value;
            sb.set_attr(attrname,color_input.value);
        });
        color_btn.render_status=[attrname,function (value){
            if(value)
                color_btn.children[0].style.backgroundColor=value;
        }];
        this.menu.appendChild(color_btn);this.menu.appendChild(color_input);
    }
    //設定某屬性，且該屬性的值為顏色，顏色提示顯示在背景
    add_cbtn2(label,pos,attrname){
        let sb=this;
        let bgcolor_btn=HtmlElement('button',"position:absolute;width:40px;height:32px;background-color:lightblue;",label);
        bgcolor_btn.style.left=pos[0]+'px';bgcolor_btn.style.top=pos[1]+'px';
        let bgcolor_input=HtmlElement('input',"visibility:hidden;position:absolute;");
        bgcolor_input.type='color';
        bgcolor_btn.onclick=function (event){
            bgcolor_input.style.left=this.offsetLeft+'px';
            bgcolor_input.style.top=(this.offsetTop+16)+'px';
            bgcolor_input.click();
        }
        bgcolor_input.addEventListener('input',(event)=>{
            bgcolor_btn.style.backgroundColor=bgcolor_input.value;
            sb.set_attr(attrname,bgcolor_input.value);
        });
        bgcolor_btn.render_status=[attrname,function (value){
            if(value)
                bgcolor_btn.style.backgroundColor=value;
        }];
        this.menu.appendChild(bgcolor_btn);this.menu.appendChild(bgcolor_input);
    }
    //用來顯示提示label
    add_label(label,pos){
        let label_span=HtmlElement('span',"position:absolute;",label);
        label_span.style.left=pos[0]+'px';label_span.style.top=pos[1]+'px';
        label_span.render_status=[null,function (value){}];
        this.menu.appendChild(label_span);
    }
    //設定某屬性，且該屬性的值為 value_list 的其中一個
    add_selection(value_list,pos,attrname,value_dict=null){
        let sb=this;
        let selection=HtmlElement('select',"position:absolute;display: inline-block;");
        selection.style.left=pos[0]+'px';selection.style.top=pos[1]+'px';
        for (let i=0;i<value_list.length;i++){
            let value=value_list[i];
            let option=HtmlElement('option','',value);
            option.value=value;
            selection.appendChild(option);
        }
        selection.addEventListener('input', (event)=>{
            if(value_dict!=null) sb.set_attr(attrname,value_dict[selection.value]);
            else sb.set_attr(attrname,selection.value);
        });
        selection.render_status=[attrname,function (value){
            if(value){
                if(value_dict!=null){
                    for(const [key, value2] of Object.entries(value_dict)){
                        if(value==value2) selection.value=key;
                    }
                }else selection.value=value;
            }else selection.value='';
        }]
        this.menu.appendChild(selection);
    }
    add_widgets(widget_list){
        for(let i=0;i<widget_list.length;i++){
            let widget=widget_list[i];
            switch(widget[0]){
                case 'btn':this.add_btn(widget[1],widget[2],widget[3],widget[4]);break;
                case 'cbtn':this.add_cbtn(widget[1],widget[2],widget[3]);break;
                case 'cbtn2':this.add_cbtn2(widget[1],widget[2],widget[3]);break;
                case 'label':this.add_label(widget[1],widget[2]);break;
                case 'select':this.add_selection(widget[1],widget[2],widget[3],widget[4]);break;
            }
        }
    }
    set_panel(size,widget_list){  //設定主面板
        this.reset(size);
        this.add_widgets(widget_list);
    }
    show(event){         //定位在 index 旁邊
        if(this.enable){
            let mwidth=this.menu.offsetWidth;
            let x=Math.max(Math.min(event.pageX-mwidth/2,window.innerWidth-70-mwidth),10);
            this.menu.style.left=x+'px';
            this.menu.style.top=(event.pageY+30*this.zoom)+'px';
            this.menu.style.visibility='visible';
            this.render_status();
        }
    }
    render_status(){
        let tmodel=this.tcontrol.tmodel;
        let _dict=copy_dict(tmodel.telements[tmodel.selecting[0]].bdict);
        for(let i=tmodel.selecting[0]+1;i<tmodel.selecting[1];i++){
            let tdict=tmodel.telements[i].bdict;
            for(const [key, value] of Object.entries(_dict)){
                if(tdict[key]){
                    if(tdict[key]!=value) delete _dict[key];
                }
            }
        }
        let children=this.menu.children;
        for(let i=0;i<children.length;i++){
            let child=children[i];
            if(child.render_status){
                child.render_status[1](_dict[child.render_status[0]]);
            }
        }
    }
    hide(){
        this.menu.style.visibility='hidden';
    }
    set_attr(attrname,value){
        let _dict={};
        _dict[attrname]=value;
        this.tcontrol.tmodel.set_attr(_dict);
        //this.tmodel.set_text_attr(p[0],p[1],p[2],p[3],p[4],p[5],p[6]);
        this.render_status();
    }

}
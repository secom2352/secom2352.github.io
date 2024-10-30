import {add_css,HtmlElement,VoidElement} from "./tool.js";
export class Resizer{
    constructor(tcontrol){
        this.tcontrol=tcontrol;
        let resizer=HtmlElement('div',"position:absolute;background-color:transparent;cursor:pointer;visibility:hidden;");
        resizer.onmousemove=function (event){
            if(event.buttons){
                if(rsr.press_btn!=null){
                    rsr.onmousemove(event);
                    tcontrol.tmodel.update_align();
                }
            }
        }
        resizer.onmouseup=function (event){
            rsr.now_panel().style.cursor=rsr.panel_cursor;
            this.style.cursor='pointer';
            if(rsr.telement!=null){
                if(rsr.press_btn!=robtn)
                    rsr.telement.transformup();
                rsr.locate_btns();
            }
        }
        //------------------------------------------------------------------方向按鈕
        let directs=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
        this.direct_btns=[];
        this.press_btn=null;
        let rsr=this;
        for(let i=0;i<directs.length;i++){
            let btn=HtmlElement('button',"width:15px;height:15px;position:absolute;");
            let direct=directs[i];
            btn.direct=direct;
            if(direct[0]+direct[1]==0)
                btn.cursor='ne-resize';
            else if(direct[0]-direct[1]==0)
                btn.cursor='nw-resize';
            else if(direct[0]==0)
                btn.cursor='s-resize';
            else if(direct[1]==0)
                btn.cursor='w-resize';
            btn.style.cursor=btn.cursor;
            btn.onmousedown=function (event){
                rsr.rel=[event.pageX,event.pageY];
                rsr.press_btn=this;
                rsr.panel_cursor=rsr.now_panel().style.cursor;
                rsr.now_panel().style.cursor=this.cursor;
                resizer.style.cursor=this.cursor;
            }
            resizer.appendChild(btn);
            this.direct_btns.push(btn);
        }
        let robtn=document.createElement('button');
        robtn.style="width: 32px;height: 32px;border-radius:16px;border: 1px solid #000;cursor:grab;position:absolute;top:0px;";
        robtn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>'
        robtn.cursor='grabbing';
        robtn.onmousedown=function (event){
            if(rsr.telement!=null){
                rsr.press_btn=robtn;
                let angle=rsr.telement.get_dict()['rotate'];
                if(angle==undefined) angle=0;
                let rect=rsr.telement.get_rect();
                rsr.telement.bdict['scale']=rect[3]+','+rect[2];
                rsr.telement.transform('rotate',parseInt(angle)+90);
            }
            //rsr.press_btn=this;
            //rsr.panel_cursor=rsr.panel.style.cursor;
            //rsr.now_panel().style.cursor=this.cursor;
            //resizer.style.cursor=this.cursor;
        }
        resizer.appendChild(robtn);
        this.robtn=robtn;
        document.body.appendChild(resizer);
        this.resizer=resizer;
        this.telement=null;          //未選定
    }
    now_panel(){
        return this.tcontrol.tmodel.element_obj;
    }
    locate_btns(){
        if(this.telement!=null){
            let rect=this.telement.get_abs_rect();
            rect=[rect[0],rect[1],rect[2]*this.tcontrol.zoom_rate,rect[3]*this.tcontrol.zoom_rate]
            let resizer=this.resizer;
            resizer.style.left=(rect[0]-10)+'px';
            resizer.style.top=(rect[1]-50)+'px';
            resizer.style.width=(rect[2]+20)+'px';
            resizer.style.height=(rect[3]+60)+'px';
            this.robtn.style.left=Math.round(rect[2]/2-8)+'px';
            for(let i=0;i<this.direct_btns.length;i++){
                let btn=this.direct_btns[i];
                btn.style.left=Math.round(rect[2]/2+rect[2]*btn.direct[0]/2)+'px';
                btn.style.top=Math.round(rect[3]/2+rect[3]*btn.direct[1]/2+40)+'px';
            }
        }
    }
    onmousemove(event){
        if(event.buttons && this.telement!=null && this.press_btn!=null){
            let btn=this.press_btn;
            let rel2=[event.pageX,event.pageY];
            if(btn==this.robtn){
                let offset=[rel2[0]-this.rel[0],rel2[1]-this.rel[1]];
                this.telement.rotate(30);
            }else{
                let offset=[(rel2[0]-this.rel[0])*btn.direct[0],(rel2[1]-this.rel[1])*btn.direct[1]];
                let rect=this.telement.get_rect();
                //console.log('新大小:'+[rect[2]+offset[0],rect[3]+offset[1]]);
                this.telement.transform('scale',[rect[2]+offset[0],rect[3]+offset[1]]);
            }
            this.locate_btns();
            this.rel=rel2;
            return true;
        }
    }
    resize(telement){
        this.telement=telement;
        this.resizer.style.visibility='visible';
        this.locate_btns();
    }
    close(){
        this.telement=null;
        this.press_btn=null;
        this.resizer.style.visibility='hidden';
        this.now_panel().style.cursor='text';
    }
}
export class CustomMenu{
    constructor(tcontrol){
        this.tcontrol=tcontrol;
        let customMenu1=HtmlElement('div',"position: absolute;visibility:hidden;background-color: #ffffff;border: 1px solid #ccc;box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.2);x: 1000;",'<ul style="list-style: none;padding: 0;margin: 0;"></ul>');
        add_css('.textctrlCM{padding: 10px 20px;cursor: pointer;background-color: white;}.textctrlCM:hover{ background-color:#e0e0e0; }');
        let cm=this;
        customMenu1.onclick=function (event){
            cm.hide();
        }
        this.add_btn(customMenu1,'貼上',function (event){
            tcontrol.tmodel.paste();
        });
        this.add_btn(customMenu1,'插入圖片',function (event){
            let url = prompt("Enter image url", "https://allen2352.github.io/speed_test.jpg");
            if (url != null) {
                tcontrol.tmodel.insert_image(url);
            }
        });
        /*this.add_btn(customMenu1,'插入連結',function (event){
            let url = prompt("Enter link url", "https://allen2352.github.io/speed_test.jpg");
            if (url != null) {
                let link_name= prompt("Enter link name", "連結");
                if (link_name != null) {
                    tcontrol.tmodel.insert_link(url,link_name);
                }
            }
        });*/
        this.add_btn(customMenu1,'文字方塊',function (event){
            tcontrol.tmodel.insert_table(1,1);
        });
        this.add_btn(customMenu1,'插入表格',function (event){
            let col = prompt("行數", "2");
            if (col != null) {
                let row= prompt("列數", "2");
                if (row != null) {
                    tcontrol.tmodel.insert_table(parseInt(row),parseInt(col));
                }
            }
        });
        this.add_btn(customMenu1,'插入html',function (event){
            let html_code = prompt("Enter html", "<button>123</button>");
            if (html_code != null) {
                tcontrol.tmodel.insert_html(html_code);
            }
        });
        document.body.appendChild(customMenu1);
        let customMenu2=HtmlElement('div',"position: absolute;visibility:hidden;background-color: #ffffff;border: 1px solid #ccc;box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.2);x: 1000;",'<ul style="list-style: none;padding: 0;margin: 0;"></ul>');
        customMenu2.onclick=function (event){
            cm.hide();
        }
        this.add_btn(customMenu2,'複製',function (event){
            tcontrol.tmodel.copy(cm.selecting);
        });
        this.add_btn(customMenu2,'剪下',function (event){
            tcontrol.tmodel.cut(cm.selecting);
        });
        this.add_btn(customMenu2,'屬性',function (event){
            let telement=tcontrol.tmodel.telements[tcontrol.tmodel.selecting[0]];
            tcontrol.resizer.resize(telement);
        });
        this.customMenu={'insert':customMenu1,'revise':customMenu2};
        document.body.appendChild(customMenu2);

    }
    show(name,event){
        this.hide();
        let customMenu=this.customMenu[name];
        let pos=[event.pageX+3,event.pageY+3];
        customMenu.style.visibility= 'visible';
        customMenu.style.left = `${pos[0]}px`;
        customMenu.style.top = `${pos[1]}px`;
    }
    onmousedown(event){
        
    }
    add_btn(customMenu,name,onclick){
        let li=HtmlElement('li','',name);
        li.classList.add("textctrlCM");
        li.onmousedown=function (event){
            //event.stopPropagation();
        }
        li.onmouseup=function (event){
            //event.stopPropagation();
        }
        li.onclick=onclick;
        customMenu.firstChild.appendChild(li);
    }
    set_telements(){

    }
    hide(){
        for(let [name, customMenu] of Object.entries(this.customMenu))
            customMenu.style.visibility= 'hidden';
    }
}
export class SelectionBox{
    constructor(tcontrol){
        this.tcontrol=tcontrol;
        let menu=HtmlElement('div',"visibility:hidden;cursor:context-menu;width: 280px;height: 35px;background-color: white;position:absolute;padding:2px;display: inline-block;border:1px solid;border-radius:5px;");
        menu.classList.add("textctrlSB");
        add_css('.textctrlSB button{cursor:pointer;position:relative;top:0px;border-radius:2px;background-color:transparent;width:32px;height:32px;border:1px solid;}.textctrlSB button:hover {background-color:beige;}');
        let sb=this;
        let typeface=HtmlElement('div',"display: inline;position:relative;top:2px;");
        this.bius=[0,0,0,0];
        let bius='bius';
        this.reset_params();
        let btns=[];
        for(let i=0;i<bius.length;i++){
            let c=bius[i];
            let btn=HtmlElement('button','','<'+c+'>'+c.toUpperCase()+'</'+c+'>');
            btn.i=i;
            btn.onclick=function (event){
                sb.bius[this.i]=[1,0][sb.bius[this.i]];
                sb.params[bius[this.i].toUpperCase()]=sb.bius[this.i];
            }
            btns.push(btn);
            typeface.appendChild(btn);
        }
        this.typeface=typeface;
        menu.appendChild(typeface);
        let font_btn=HtmlElement('select',"display: inline-block;top:-20px;");
        let fontsize_list=[8,9,10,11,12,14,18,24,30,36,48,60,72,96];
        for (let i=0;i<fontsize_list.length;i++){
            let num=fontsize_list[i];
            let option=HtmlElement('option','',num);
            option.value=num;
            font_btn.appendChild(option);
        }
        font_btn.addEventListener('input', (event)=>{
            sb.params['fontSize']=font_btn.value;
            sb.set_attr();
        })
        menu.appendChild(VoidElement('10px'));
        menu.appendChild(font_btn);
        menu.appendChild(VoidElement('10px'));
        let color_btn=HtmlElement('button',"width:40px;",'A<div style="width:25px;height:5px;background-color:red;border:1px solid;"></div>');
        let color_input=HtmlElement('input',"visibility:hidden;position:absolute;");
        color_input.type='color';
        color_btn.onclick=function (event){
            color_input.style.left=this.offsetLeft+'px';
            color_input.style.top=(this.offsetTop+16)+'px';
            color_input.click();
        }
        color_input.addEventListener('input',(event)=>{
            sb.params['color']=color_input.value;
            color_btn.children[0].style.backgroundColor=color_input.value;
            sb.set_attr();
        });
        menu.appendChild(color_btn);
        menu.appendChild(color_input);
        menu.appendChild(VoidElement('10px'));
        let bgcolor_btn=HtmlElement('button',"top:2px;background-color:lightblue;",'bg');
        let bgcolor_input=HtmlElement('input',"visibility:hidden;position:absolute;");
        bgcolor_input.type='color';
        bgcolor_btn.onclick=function (event){
            bgcolor_input.style.left=this.offsetLeft+'px';
            bgcolor_input.style.top=(this.offsetTop+16)+'px';
            bgcolor_input.click();
        }
        bgcolor_input.addEventListener('input',(event)=>{
            sb.params['bgcolor']=bgcolor_input.value;
            bgcolor_btn.style.backgroundColor=bgcolor_input.value;
            sb.set_attr();
        });
        menu.appendChild(bgcolor_btn);
        menu.appendChild(bgcolor_input);
        this.btns=[btns[0],btns[1],btns[2],btns[3],font_btn,color_btn,bgcolor_btn];
        menu.onmousedown=function (event){
            //event.stopPropagation();
            sb.reset_params();
        }
        menu.onmouseup=function (event){
            //event.stopPropagation();
            
        }
        menu.onclick=function (event){
            //event.stopPropagation();
            sb.set_attr();
        }
        document.body.appendChild(menu);
        this.menu=menu;
    }
    show(x,y){         //定位在 index 旁邊
        let mwidth=this.menu.offsetWidth;
        x=Math.max(Math.min(x-mwidth/2,window.innerWidth-70-mwidth),10);
        this.menu.style.left=x+'px';
        this.menu.style.top=(y+this.menu.offsetHeight-10)+'px';
        this.menu.style.visibility='visible';
        this.render_status();
    }
    render_status(){
        let bdict=this.tcontrol.tmodel.inherit_text_dict(this.tcontrol.tmodel.selecting[0]+1);
        let bius='BIUS';
        for(let i=0;i<bius.length;i++){
            let c=bius[i];
            if(bdict[c]){
                this.bius[i]=bdict[c];
                if(this.bius[i]){
                    this.typeface.children[i].style.backgroundColor='#cccccc';
                    continue;
                }
            }
            this.typeface.children[i].style.backgroundColor='#00000000';
        }
        this.btns[4].value=bdict['fontSize'];
        if(bdict['color'])
            this.btns[5].children[0].style.backgroundColor=bdict['color'];
        else this.btns[5].children[0].style.backgroundColor='#00000000';
        this.btns[6].style.backgroundColor=bdict['bgcolor'];
    }
    hide(){
        this.menu.style.visibility='hidden';
    }
    reset_params(){
        this.params={};
    }
    set_attr(){
        this.tcontrol.tmodel.set_attr(this.params);
        //this.tmodel.set_text_attr(p[0],p[1],p[2],p[3],p[4],p[5],p[6]);
        this.render_status();
    }

}
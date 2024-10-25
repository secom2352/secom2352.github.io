import { HtmlElement,convert_string,isASCII,copy_dict, TeString_to_bdict,LString_to_List,List_to_LString} from "./tool.js";
import { TElement,Br,Link_space,Char,Align,TextGroup,Image,Link,Table,Html} from "./telement.js";

export class TModel{
    constructor(tcontrol,element_obj){
        this.tcontrol=tcontrol;
        this.element_obj=element_obj
        this.telements=[];           //描述物件集
        this.padding=[5,5];   //上下 左右
        //----------------------------------------------element_obj屬性
        element_obj.style.padding=this.padding[0]+'px '+this.padding[1]+'px';
        element_obj.style.cursor='text';
        element_obj.style.backgroundColor='white';
        element_obj.innerHTML='<div style="user-select: none;"></div>';
        this.displayer=element_obj.firstChild;           //顯示器
        let tmodel=this;
        this.max_width=element_obj.offsetWidth-2*this.padding[0];
        //-------------------------------------------------------------------------輸入物件
        this.index=0;      //-----------------------------------輸入位置
        this.selecting=[0,0];      //起始，終點
        let inp=HtmlElement('input',"position:absolute;width:1px;background-color:transparent;outline:none;border:transparent;");
        let _inp=HtmlElement('span',"color:black;display:inline-block;");
        this.inp=inp;
        this._inp=_inp;
        this.TElementRegistry={
            'br':Br,'link_space':Link_space,'char':Char,'align':Align,
            'textgroup':TextGroup,'image':Image,'link':Link,'table':Table,'html':Html
        };
        this.debugging=false;
        this.observe_attr=null;     //當內容被選取時，開始觀察，屬性變更結束後儲存
        //------------------------------編輯歷史
        this.history=[];
        this.hindex=0;
        this.update_history=true;
        //------------------------------------------------------選擇處理
        function render_selection(){
            let selecting=[Math.min(tmodel.selecting[0],tmodel.selecting[1]),Math.max(tmodel.selecting[0],tmodel.selecting[1])];
            let telements=tmodel.telements;
            for(let i=0;i<telements.length;i++){
                let is_select=i>=selecting[0] && i<selecting[1];
                telements[i].select(is_select);
            }
        }
        //--------------------------------------------------------------------------點擊事件
        this.mousepress=false;
        element_obj.onmousedown=function (event){
            
            //event.stopPropagation();
            if(event.button==0){
                if(tcontrol.tmodel!=tmodel){
                    if(!tcontrol.focus(tmodel))return;
                }
                tcontrol.focuslock=true;
                tcontrol.customMenu.hide();
                let index=tmodel.mousetap(event);
                if(!shift_key){
                    tmodel.selecting[0]=index;
                    tmodel.selecting[1]=index;
                    render_selection();
                }
                tmodel.mousepress=true;
            }
        }
        element_obj.onmousemove=function (event){
            //event.stopPropagation();
            tcontrol.resizer.onmousemove(event);
            if(tmodel.mousepress){
                if(event.buttons){
                    let index=tmodel.mousetap(event);
                    tmodel.selecting[1]=index;
                    let selecting=[Math.min(tmodel.selecting[0],index),Math.max(tmodel.selecting[0],index)];
                    let telements=tmodel.telements;
                    for(let i=0;i<telements.length;i++){
                        let is_select=i>=selecting[0] && i<selecting[1];
                        telements[i].select(is_select);
                    }
                }else tmodel.mousepress=false;
            }
        }
        element_obj.onmouseup=function (event){
            //event.stopPropagation();
            if(event.button==0 && tmodel.mousepress){
                tcontrol.resizer.close();
                let index=tmodel.mousetap(event);
                tmodel.selecting=[Math.min(tmodel.selecting[0],index),Math.max(tmodel.selecting[0],index)];
                render_selection();
                tmodel.index=index;
                tmodel.show_inp();
                inp_x=inp.offsetLeft;
                if(tmodel.selecting[0]<tmodel.selecting[1]){
                    tcontrol.selectionbox.show(event.pageX,event.pageY);
                    tmodel.observe_attr=[tmodel.selecting[0],tmodel.Copy_TmString(tmodel.selecting[0],tmodel.selecting[1])];
                }
                else if(tmodel.observe_attr!=null){
                    let osr=tmodel.observe_attr;
                    let TmString=tmodel.Copy_TmString(osr[0],osr[0]+LString_to_List(osr[1]).length);
                    if(TmString!=osr[1]){
                        tmodel.record_history('S',osr[0],osr[1],TmString);
                    }
                    tmodel.observe_attr=null;
                    tcontrol.selectionbox.hide();
                }
                tcontrol.focuslock=false;
            }//else tcontrol.selectionbox.hide();
            tmodel.mousepress=false;
        }
        element_obj.onclick=function (event){
            //event.stopPropagation();
            //tmodel.customMenu.hide();
        }
        element_obj.ondblclick=function (event){
            //event.stopPropagation();
            if(tcontrol.tmodel==tmodel){
                let ord_te=tmodel.mousetap(event,undefined,true);
                let index=ord_te[0];let telement=ord_te[1];
                if (!(typeof telement=='number')){
                    tmodel.observe_attr=[index,tmodel.Copy_TmString(index,index+1)];
                    tcontrol.resizer.resize(telement);
                }
                tmodel.mousepress=false;
            }
        }
        element_obj.addEventListener('contextmenu', function(event) {
            tcontrol.selectionbox.hide();
            event.preventDefault();
            let cm=tcontrol.customMenu;
            event.stopPropagation();
            let tap_selected=tmodel.mousetap(event,true);
            if(tap_selected!='yes'){
                cm.show('insert',event);
                tmodel.index=tmodel.mousetap(event);
                tmodel.show_inp();
            }else{
                cm.show('revise',event);
                cm.selecting=[tmodel.selecting[0],tmodel.selecting[1]];
            }
        });
        //-------------------------------------------------------------------初始化設定
        this.text_dict={
            'type':'text',
            'fontSize':30,                                  //字大小
            'text':'c',                                        //文字
        };   
        _inp.style.fontSize=this.text_dict['fontSize'];
        this._inp=_inp;
        let keypress=false;
        let inp_x=0;     //固定水平
        this.input_mode='text';
        this.input_funcs={'text':this.insert_chars};         //可用的輸入模式
        inp.addEventListener('paste', function (event) {
            event.stopPropagation();
            event.preventDefault();          // 阻止默認的貼上行為
            const pastedData = (event.clipboardData || window.clipboardData).getData('text');
            tmodel.paste(pastedData);
        });
        let shift_key=false;
        inp.addEventListener('keydown',function(event){
            event.stopPropagation();
            tcontrol.selectionbox.hide();
            shift_key=event.shiftKey;
            if (event.ctrlKey) {
                if(tmodel.selecting[0]!=tmodel.selecting[1]){
                    if(event.code=='KeyC'){
                        tmodel.copy();
                    }else if(event.code=='KeyX'){
                        tmodel.cut();
                        tmodel.selecting[0]=tmodel.selecting[1];
                    }
                }
                if(event.code=='KeyA'){
                    tmodel.index=tmodel.telements.length;
                    tmodel.selecting=[0,tmodel.index];
                    render_selection();
                }else if(event.code=='KeyZ'){
                    if(shift_key) tmodel.forward();
                    else tmodel.back();
                }
            }
            if(event.isComposing){
                if(event.code=='ArrowLeft'){       //按下左鍵
                    let tem_html=_inp.innerHTML;
                    if(this.selectionStart>0){
                        _inp.innerHTML=convert_string(this.value.substring(0,this.selectionStart-1));
                        inp_x=(_inp.offsetLeft+_inp.offsetWidth-2);
                        this.style.left=inp_x+'px';
                        _inp.innerHTML=tem_html;
                    }
                }else if(event.code=='ArrowRight'){       //按下右鍵
                    let tem_html=_inp.innerHTML;
                    if(this.selectionStart<this.value.length){
                        _inp.innerHTML=convert_string(this.value.substring(0,this.selectionStart+1));
                        inp_x=(_inp.offsetLeft+_inp.offsetWidth-2);
                        this.style.left=inp_x+'px';
                        _inp.innerHTML=tem_html;
                    }
                }else{
                    keypress=true;
                }
            }else{
                if(tmodel.selecting[0]!=tmodel.selecting[1]){
                    let selecting=tmodel.selecting;
                    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)){
                        if(event.code=='ArrowLeft'){
                            tmodel.index=selecting[0];
                        }else if(event.code=='ArrowRight'){
                            tmodel.index=selecting[1];
                        }else if(event.code=='ArrowUp'){
                            tmodel.index=tmodel.tap(this.offsetLeft,this.offsetTop-this.offsetHeight/2);
                        }else if(event.code=='ArrowDown'){
                            tmodel.index=tmodel.tap(this.offsetLeft,this.offsetTop+this.offsetHeight*3/2);
                        }
                        tmodel.show_inp();
                        if(['ArrowLeft','ArrowRight'].includes(event.code))  inp_x=this.offsetLeft;
                        tmodel.selecting[0]=tmodel.selecting[1];
                        render_selection();
                    }else if(event.code=='Enter'){
                        tmodel.delete(tmodel.selecting[0],tmodel.selecting[1]);tmodel.change_line();tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else if(event.code=='Backspace'){
                        tmodel.delete(tmodel.selecting[0],tmodel.selecting[1]);tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else if(event.code=='Delete'){
                        tmodel.delete(tmodel.selecting[0],tmodel.selecting[1]);tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else keypress=true;
                }else{
                    let change_inp_x=true;
                    if(event.code=='ArrowLeft' && tmodel.index>0){
                        tmodel.index--;
                        if(tmodel.telements[tmodel.index].type=='link_space')
                            tmodel.index--;
                    }else if(event.code=='ArrowRight' && tmodel.index<tmodel.telements.length){
                        tmodel.index++;
                        if(tmodel.telements[tmodel.index-1].type=='link_space')
                            tmodel.index++;
                    }else if(event.code=='ArrowUp'){
                        tmodel.index=tmodel.tap(inp_x,this.offsetTop-this.offsetHeight/2);
                        change_inp_x=false;
                    }else if(event.code=='ArrowDown'){
                        tmodel.index=tmodel.tap(inp_x,this.offsetTop+this.offsetHeight*3/2);
                        change_inp_x=false;
                    }else if(event.code=='Enter'){
                        tmodel.change_line();
                    }else if(event.code=='Backspace'){
                        tmodel.delete(tmodel.index-1);
                    }else if(event.code=='Delete'){
                        tmodel.delete(tmodel.index);
                    }else {
                        keypress=true;
                        return;
                    }
                    tmodel.show_inp();
                    if(change_inp_x)
                        inp_x=this.offsetLeft;
                }
            }
        });
        inp.addEventListener('input',function (event) {
            event.stopPropagation();
            if(keypress){
                if(tmodel.delete(tmodel.selecting[0],tmodel.selecting[1]))
                    tmodel.show_inp();
                let tem_html=convert_string(this.value);
                if(!event.isComposing && isASCII(tem_html)){
                    tmodel.input(this.value);
                    this.value='';
                    tmodel.show_inp();
                }else{
                    _inp.innerHTML=tem_html;
                    this.style.top=Math.round(_inp.offsetTop+_inp.offsetHeight/16)+'px';
                    inp_x=(_inp.offsetLeft+_inp.offsetWidth-2);
                    this.style.left=inp_x+'px';
                    this.style.fontSize=Math.round(_inp.offsetHeight*3/4)+'px';
                    if(event.isComposing)
                        _inp.style.borderBottom='1px dashed #000';
                    else _inp.style.borderBottom='0px';
                }
                //tmodel.update_align
            }//else this.value='';
            
        });
        inp.addEventListener('keyup',function (event){
            event.stopPropagation();
            shift_key=false;
            if(keypress){
                if (!event.isComposing && this.value!='') { //event.code == 'Enter' || 
                    tmodel.input(this.value);
                    this.value='';
                    _inp.innerHTML='';
                    tmodel.show_inp();
                }
            }
            keypress=false;
        });
        this.inp=inp;
    }
    debug(){
        this.debugging=!this.debugging;
        if(this.debugging){
            for(let i=0;i<this.telements.length;i++)
                this.telements[i].debug();
        }
    }
    unfocus(){
        if(this.observe_attr!=null){
            let osr=this.observe_attr;
            let TmString=this.Copy_TmString(osr[0],osr[0]+LString_to_List(osr[1]).length);
            if(TmString!=osr[1]){
                this.record_history('S',osr[0],osr[1],TmString);
            }
            this.observe_attr=null;
        }
        for(let i=0;i<this.telements.length;i++) this.telements[i].select(false);
    }
    mousetap(event,is_selected=false,get_telement=false){
        let rect=this.displayer.getBoundingClientRect();
        //console.log('boundary:'+[rect.left,rect.top]);
        let pos=[event.clientX-rect.left,event.clientY-rect.top];
        //let pos=[event.clientX,event.clientY];
        //console.log('mouse:'+[event.clientX,event.clientY]);
        return this.tap(pos[0]/this.tcontrol.zoom_rate,pos[1]/this.tcontrol.zoom_rate,is_selected,get_telement);
    }
    tap(x,y,is_selected=false,get_telement=false){
        this.remove_inp();
        let fit_y=[null,null];        //y座標符合且最接近的,分數
        //先找到最接近y
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
                        return [i,telement];
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
    show_inp(){
        this.remove_inp();
        let inp=this.inp;
        let fontSize=this.inherit_text_dict()['fontSize'];
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
    remove_inp(){
        if(this.displayer.contains(this.inp))
            this.displayer.removeChild(this.inp);
        if(this.displayer.contains(this._inp))
            this.displayer.removeChild(this._inp);
    }
    change_line(){
        this.update_history=false;
        this.insert_telement(new Br(this));
        let build_dict=copy_dict(this.text_dict);
        build_dict['fontSize']=this.inherit_text_dict()['fontSize'];
        this.insert_telement(new Link_space(this,build_dict));
        this.record_history('A',this.index-2,this.index);
        this.update_history=true;
    }
    inherit_dict(dtype,index=null){
        if(index==null)
            index=this.index;
        let i=this.find_telement(dtype);
        if(-1<i && i<this.telements.length) return this.telements[i].get_dict();
        return null;
    }
    inherit_text_dict(index=null){
        let bdict=this.inherit_dict(this.input_mode,index);
        if(bdict!=null) return bdict;
        return this.text_dict;
    }
    find_telement(tetype,direct=-1,index=null){
        if(index==null) index=this.index;
        let k=this.index;
        while (-1<k && k<this.telements.length){
            if(this.telements[k].type==tetype)
                return k;
            k+=direct;
        }
        return k;
    }
    update_align(){
        let line_width=this.displayer.offsetWidth-this.padding[0]*2;
        let l=this.find_telement('link_space',-1,this.index-1)+1;
        let w=0;              //目前累積寬度
        while (l<this.telements.length){
            let telement=this.telements[l];
            if(telement.type=='br') break;
            if(l==this.index)
                w+=this._inp.offsetWidth;
            if(telement.type=='align'){
                let align=telement.bdict['align'];
                if(align=='left'){}
                else if(align=='center'){
                    //計算center後長度
                    let cw=0;
                    let c=l+1;
                    while (c<this.telements.length){
                        let te=this.telements[c];
                        if(te.type=='br') break;
                        if(c==this.index)
                            cw+=this._inp.offsetWidth;
                        if(te.type=='align') break;    //該align必定是 right
                        cw+=te.get_rect()[2];
                        c++;
                    }
                    let csize=Math.max(Math.round(line_width/2-cw/2-w),0);
                    telement.transform('scale',[csize,Math.round(this.inherit_text_dict()['fontSize'])]);
                    
                    w+=csize;
                }
                else if(align=='right'){
                    //計算right後長度
                    let rw=0;
                    let r=l+1;
                    while (r<this.telements.length){
                        let te=this.telements[r];
                        if(te.type=='br') break;
                        if(r==this.index)
                            rw+=this._inp.offsetWidth;
                        rw+=te.get_rect()[2];
                        r++;
                    }
                    let rsize=Math.round(line_width-w-rw);
                    telement.transform('scale',[rsize,Math.round(this.inherit_text_dict()['fontSize'])]);
                    w+=rsize+rw;
                    break;
                }
            }else{
                w+=telement.get_rect()[2];
            }
            l++;
        }

    }
    record_history(htype='A',index=null,index2=null,TmString=null){
        if(index==null) index=this.index;
        if(index2==null) index2=index+1;
        if(this.history.length>this.hindex)     //要一樣才是標準
            this.history.splice(this.hindex,this.history.length-this.hindex);
        if(htype=='S') this.history.push([htype,index,index2,TmString]);
        else this.history.push([htype,index,this.Copy_TmString(index,index2)]);
        this.hindex++;
        this.update_history=true;
    }
    //------------------------------------------------------------------外部語法糖
    delete(index=null,index2=null){
        if(index==null) index=this.index;
        if(index2==null) index2=index+1;
        if(index>=index2) return false;
        //------------------------------------------------開始刪除
        this.remove_inp();
        if(index>0 && this.telements[index-1].type=='br') index--;
        if(index<this.telements.length && this.telements[index].type=='link_space') index2++;
        if(this.update_history)
            this.record_history('D',index,index2);
        if(-1<index && index<this.telements.length){
            let times=index2-index;
            this.telements.splice(index,times);
            for (let i=0;i<times;i++){
                this.displayer.removeChild(this.displayer.children[index]);
            }
            this.selecting[1]=this.selecting[0];
        }
        //-------------------------------------------------檢查br和link_space
        this.index=index;
        this.update_align();
        return true;
    }
    set_align(align){
        this.update_history=false;
        let l=this.find_telement('link_space',-1,this.index-1)+1;
        let r=this.find_telement('br',1,this.index);
        let TmString=this.Copy_TmString(l,r);
        this.insert_telement(new Align(this,{'align':align}));
        r=this.find_telement('br',1,this.index);
        this.record_history('S',l,TmString,this.Copy_TmString(l,r));
        this.update_history=true;
    }
    set_attr(mdict){
        let selecting=this.selecting;
        this.remove_inp();
        //let TmString=null
        //if(this.update_history) TmString=this.Copy_TmString(selecting[0],selecting[1]);
        for(let i=selecting[0];i<selecting[1];i++){
            let telement=this.telements[i];
            telement.update(mdict);
        }
        //if(this.update_history){
        //    this.history.push(['S',selecting[0],TmString,this.Copy_TmString(selecting[0],selecting[1])]);
        //    this.hindex++;
        //}
    }
    //---------------------------------------------------------------輸入
    insert_telement(_telement,mdict=null,index=null,update_history=true){
        if(index!=null) this.index=index;
        if(_telement==null){
            if(mdict==null) return;        //通常會發生在該元素無法複製，返回空值
            console.log(mdict);
            if(mdict['type']==undefined) return;    //代表是空字典
            _telement=new this.TElementRegistry[mdict['type']](this,mdict);
        }else if (mdict!=null){
            Object.assign(_telement.bdict,mdict);
        }
        if(_telement.type=='align'){
            let align=_telement.bdict['align'];
            let tmodel=this;
            function remove_left(align){
                let l=tmodel.index-1;
                while (l>-1){
                    let telement=tmodel.telements[l];
                    if (telement.type=='link_space')
                        break;
                    if(telement.type=='align' && telement.bdict['align']==align){
                        tmodel.delete(l);
                        tmodel.index--;
                    }
                    l--;
                }
            }
            function remove_right(align){
                let k=tmodel.index;
                while (k<tmodel.telements.length){
                    let telement=tmodel.telements[k];
                    if (telement.type=='br')
                        break;
                    if(telement.type=='align' && telement.bdict['align']==align){
                        tmodel.delete(k);
                    }else k++;
                }
            }
            let tem_index=this.index;   //防止刪除後原指標移位;
            if(align=='left'){remove_left('center');remove_left('right');remove_left('left');
            }else if(align=='center'){remove_left('right');remove_left('center');remove_right('left');remove_right('center');
            }else if(align=='right'){remove_right('center');remove_right('right');remove_right('left');}
            this.index=tem_index;
        }
        this.telements.splice(this.index, 0,_telement);
        let all_chars=this.displayer.children;
        if(all_chars.length==0)
            this.displayer.appendChild(_telement.container);
        else{
            if(this.index==0)
                this.displayer.insertBefore(_telement.container,this.displayer.firstChild);
            else all_chars[this.index-1].after(_telement.container);
        }
        _telement.update();
        if(this.debugging) _telement.debug();
        this.update_align();
        //更新歷史
        if(update_history && this.update_history)
            this.record_history('A',this.index);
            
        this.index++;
    }
    insert_telements(_telements,by_dict=false,index=null){    //大量輸入
        if(index!=null) this.index=index;
        index=this.index;
        if(by_dict){
            for(let i=0;i<_telements.length;i++)
                this.insert_telement(null,_telements[i],null,false);
        }else{
            for(let i=0;i<_telements.length;i++)
                this.insert_telement(_telements[i],null,null,false);
        }
        if(this.update_history) this.record_history('A',index,index+_telements.length);
    }
    input(text_string,mdict=null){
        this.update_history=false;
        let index=this.index;
        this.input_funcs[this.input_mode].call(this,text_string,mdict);
        this.record_history('A',index,this.index);
    }
    insert_chars(chars,mdict=null){
        let bdict=copy_dict(this.inherit_text_dict());
        if(mdict!=null) Object.assign(bdict,mdict);
        for (let i=0;i<chars.length;i++){
            let build_dict=copy_dict(bdict);
            let c=chars[i];
            if (c=='\n')
                this.change_line();
            else{
                build_dict['text']=c;
                this.insert_telement(new Char(this,build_dict));
            }
        }
    }
    insert_textgroup(text_string,mdict=null){          //插入文字，mdict是除此之外要加入的屬性，文字會自動繼承先前屬性
        let bdict=copy_dict(this.inherit_text_dict());
        if(mdict!=null) Object.assign(bdict,mdict);
        bdict['text']=text_string;
        this.insert_telement(new TextGroup(this,bdict));
    }
    insert_image(src,mdict=null){         //插入圖片
        this.insert_telement(new Image(this,{'src':src}),mdict);
    }
    insert_link(href,name){                      //插入連結
        this.insert_telement(new Link(this,{'text':name,'href':href}));
    } 
    insert_table(row,col){                         //插入表格
        this.insert_telement(new Table(this,{'ranks':`${row},${col}`}));
    }
    insert_html(html){                       //插入html
        this.insert_telement(new Html(this,{'html':html}));
    }
    //--------------------------------------------------------------------------------------------儲存與載入
    copy(range=null){
        if(range==null) range=this.selecting;
        let stringlist=[];
        let telements=this.telements;
        for(let i=range[0];i<range[1];i++){
            let telement=telements[i];
            if (telement.type=='text')
                stringlist.push(telement.bdict['text']);
            else if(telement.type=='br')
                stringlist.push('\n')
        }
        let string=stringlist.join('');
        if(range[1]-range[0]>0){
            this.tcontrol.copy_string=string;
            this.tcontrol.copy_tmstring=this.Copy_TmString(range[0],range[1]);   
        }
        navigator.clipboard.writeText(string);
        return string;
    }
    paste(pastedData=null,index=null){
        if(pastedData==null) pastedData=this.tcontrol.copy_string;
        if(index!=null) this.index=index;
        if(pastedData==this.tcontrol.copy_string){
            console.log('符合');
            this.Insert_TmString(this.tcontrol.copy_tmstring);
        }else{
            this.input(pastedData);
        }
        this.show_inp();
    }
    cut(range=null){
        if(range==null) range=this.selecting;
        this.copy(range);
        this.delete(range[0],range[1]);
        this.show_inp();
    }
    //--------------------------------------------------------------------------------------------儲存與載入
    Copy_TmString(index=null,index2=null){               //複製某段落的物件字串
        if(index==null) index=this.index;
        if(index2==null) index2=index+1;
        let box=[];
        for(let i=index;i<index2;i++){
            box.push(this.telements[i].ToString());
        }
        return List_to_LString(box);
    }
    ToString(){                              //將內容轉為物件字串
        return this.Copy_TmString(0,this.telements.length);
    }
    Insert_TmString(TmString,index=null){                //插入物件字串
        if(index==null) index=this.index;
        let box=LString_to_List(TmString);
        let _telements=[];
        for(let i=0;i<box.length;i++){
            _telements.push(TeString_to_bdict(box[i]));
        }
        this.insert_telements(_telements,true,index);
    }
    LoadString(TmString){                    //載入物件字串
        this.delete(0,this.telements.length);     //刪除全部
        this.Insert_TmString(TmString);
    }
    back(){
        this.update_history=false;
//        console.log(this.history)
        if(this.hindex>0){
            this.hindex--;
            let action=this.history[this.hindex];
            switch(action[0]){
                case 'A':
                    this.delete(action[1],action[1]+LString_to_List(action[2]).length);
                    break;
                case 'D':
                    this.Insert_TmString(action[2],action[1]);
                    break;
                case 'S':
                    this.delete(action[1],action[1]+LString_to_List(action[3]).length);
                    this.Insert_TmString(action[2],action[1]);
                    break;
            }
            this.show_inp();
        }
        this.update_history=true;
    }
    forward(){
        this.update_history=false;
        if(this.hindex<this.history.length){
            let action=this.history[this.hindex];
            switch(action[0]){
                case 'A':
                    this.Insert_TmString(action[2],action[1]);
                    break;
                case 'D':
                    this.delete(action[1],action[1]+LString_to_List(action[2]).length);
                    break;
                case 'S':
                    this.delete(action[1],action[1]+LString_to_List(action[2]).length);
                    this.Insert_TmString(action[3],action[1]);
                    break;
            }
            this.hindex++;
            this.show_inp();
        }
        this.update_history=true;
    }
}
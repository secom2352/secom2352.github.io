import { HtmlElement,convert_string,isASCII,copy_dict, TeString_to_bdict,LString_to_List,List_to_LString} from "./tool.js";
import { TElement,Br,Link_space,Char,Align} from "./telement.js";

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
        this.TElementRegistry={'br':Br,'link_space':Link_space,'char':Char,'align':Align};
        this.debugging=false;
        //------------------------------------------------------選擇處理
        function render_selection(){
            let selecting=[Math.min(tmodel.selecting[0],tmodel.selecting[1]),Math.max(tmodel.selecting[0],tmodel.selecting[1])];
            let telements=tmodel.telements;
            for(let i=0;i<telements.length;i++){
                let is_select=i>=selecting[0] && i<selecting[1];
                telements[i].select(is_select);
            }
        }
        function get_selection(){
            let selecting=tmodel.selecting;
            let string='';
            let telements_box=[];
            let telements=tmodel.telements;
            for(let i=0;i<telements.length;i++){
                if(i>=selecting[0] && i<selecting[1]){
                    let telement=telements[i];
                    if (telement.type=='text')
                        string+=telement.bdict['text'];
                    telements_box.push(telement.ToString());
                }
            }
            if(telements_box.length>0){
                tcontrol.copy_string=string;
                tcontrol.copy_telements=List_to_LString(telements_box);
                
            }
            return string;
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
                if(tmodel.selecting[0]<tmodel.selecting[1])
                    tcontrol.selectionbox.show(event.pageX,event.pageY);
                else tcontrol.selectionbox.hide();
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
                let telement=tmodel.mousetap(event,undefined,true);
                if (!(typeof telement=='number')){
                    tcontrol.resizer.resize(telement);
                }
                tmodel.mousepress=false;
            }
        }
        element_obj.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            let cm=tcontrol.customMenu;
            event.stopPropagation();
            let tap_selected=tmodel.mousetap(event,true);
            if(tap_selected!='yes'){
                cm.customMenu.style.visibility= 'visible';
                cm.customMenu.style.left = `${event.clientX}px`;
                cm.customMenu.style.top = `${event.clientY}px`;
            }else{
                cm.customMenu2.style.visibility= 'visible';
                cm.customMenu2.style.left = `${event.clientX}px`;
                cm.customMenu2.style.top = `${event.clientY}px`;
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
            if(pastedData==tcontrol.copy_string){
                console.log('符合');
                tmodel.Insert_TmString(tcontrol.copy_telements);
            }else{
                tmodel.input(pastedData);
            }
        });
        let shift_key=false;
        inp.addEventListener('keydown',function(event){
            event.stopPropagation();
            tcontrol.selectionbox.hide();
            if (event.ctrlKey) {
                if(tmodel.selecting[0]!=tmodel.selecting[1]){
                    if(event.code=='KeyC'){
                        navigator.clipboard.writeText(get_selection());
                    }else if(event.code=='KeyX'){
                        navigator.clipboard.writeText(get_selection());
                        tmodel.delete(tmodel.selecting[0],tmodel.selecting[1]);
                        tmodel.selecting[0]=tmodel.selecting[1];
                        tmodel.show_inp();
                    }
                }
                if(event.code=='KeyA'){
                    tmodel.index=tmodel.telements.length;
                    tmodel.selecting=[0,tmodel.index];
                    render_selection();
                }
            }
            shift_key=event.shiftKey;
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
                if (!event.isComposing) { //event.code == 'Enter' || 
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
        this.insert_telement(new Br(this));
        let build_dict=copy_dict(this.text_dict);
        build_dict['fontSize']=this.inherit_text_dict()['fontSize'];
        this.insert_telement(new Link_space(this,build_dict));
    }
    inherit_dict(dtype,index=null){
        if(index==null)
            index=this.index;
        if (index>0){
            let k=index-1;
            while (k>-1){
                let _bdict=this.telements[k].get_dict();
                if(this.telements[k].type==dtype){
                    return _bdict;
                }
                k--;
            }
        }
        return null;
    }
    inherit_text_dict(index=null){
        let bdict=this.inherit_dict(this.input_mode,index);
        if(bdict!=null) return bdict;
        return this.text_dict;
    }
    update_align(){
        let line_width=this.displayer.offsetWidth-this.padding[0]*2;
        let l=Math.max(this.index-1,0);
        //-------------------------------------------------定位到最左邊
        while (l>0){
            if (this.telements[l].type=='link_space')
                break;
            l--;
        }
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
    //------------------------------------------------------------------外部語法糖
    delete(index=null,index2=null){
        if(index==null) index=this.index;
        if(index2==null) index2=index+1;
        if(index>=index2) return false;
        //------------------------------------------------開始刪除
        this.remove_inp();
        if(-1<index && index<this.telements.length){
            let times=index2-index;
            this.telements.splice(index,times);
            for (let i=0;i<times;i++){
                this.displayer.removeChild(this.displayer.children[index]);
            }
            this.selecting[1]=this.selecting[0];
        }
        //-------------------------------------------------檢查br和link_space
        if(index>0 && this.telements[index-1].type=='br')
            this.delete(index-1);
        if(index<this.telements.length && this.telements[index].type=='link_space')
            this.delete(index);
        this.index=index;
        this.update_align();
        return true;
    }
    set_align(align){
        this.insert_telement(new Align(this,{'align':align}));
    }
    set_attr(mdict){
        let selecting=this.selecting;
        this.remove_inp();
        for(let i=selecting[0];i<selecting[1];i++){
            let telement=this.telements[i];
            telement.update(mdict);
        }
    }
    insert_telement(_telement,by_dict=false){
        if(_telement==null) return;        //通常會發生在該元素無法複製，返回空值
        if (by_dict){       //如果是字典，就自動轉換
            if(_telement['type']==undefined) return;    //代表是空字典
            _telement=new this.TElementRegistry[_telement['type']](this,_telement);
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
            if(align=='left'){remove_left('center');remove_left('right');remove_left('left');
            }else if(align=='center'){remove_left('right');remove_left('center');remove_right('left');remove_right('center');
            }else if(align=='right'){remove_right('center');remove_right('right');remove_right('left');}
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
        this.index++;
    }
    input(text_string,mdict=null){
        this.input_funcs[this.input_mode].call(this,text_string,mdict);
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
    ToString(){
        let box=[];
        for(let i=0;i<this.telements.length;i++){
            box.push(this.telements[i].ToString());
        }
        return List_to_LString(box);
    }
    Insert_TmString(TmString){
        let box=LString_to_List(TmString);
        for(let i=0;i<box.length;i++){
            this.insert_telement(TeString_to_bdict(box[i]),true);
        }
    }
    LoadString(TmString){
        this.delete(0,this.telements.length);     //刪除全部
        this.Insert_TmString(TmString);
    }
}
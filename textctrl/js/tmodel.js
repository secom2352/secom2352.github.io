import {copy_dict,convert_string, HtmlElement,isASCII} from "./tool.js";
import {TElement} from "./telement.js";
import {Resizer,CustomMenu,SelectionBox} from "./ui.js";
//-----------------------------------------------------------------------------------------------
export class TModel{
    constructor(element_obj){
        this.element_obj=element_obj
        this.width=element_obj.offsetWidth;
        this.height=element_obj.offsetHeight;
        this.telements=[];           //描述物件集
        this.padding=[5,5];   //上下 左右
        element_obj.style.padding=this.padding[0]+'px '+this.padding[1]+'px';
        element_obj.style.cursor='text';
        element_obj.style.backgroundColor='white';
        element_obj.innerHTML='<div style="user-select: none;"></div>'
        //element_obj.firstChild.border="1px solid;";
        this.displayer=element_obj.firstChild;           //顯示器
        this.resizer=new Resizer(element_obj);
        this.customMenu=new CustomMenu(this);
        this.selectionbox=new SelectionBox(this);
        let tmodel=this;
        this.input_mode=['text'];
        element_obj.onmousedown=function (event){
            event.stopPropagation();
            if(event.button==0){
                //tmodel.customMenu.hide();
                tmodel.resizer.onmousedown(event);
                tmodel.customMenu.onmousedown(event);
                //let index=tmodel.tap(event.pageX-this.offsetLeft-tmodel.padding[0],event.pageY-this.offsetTop-tmodel.padding[1]);
                let pos=tmodel.get_rel_pos(event);
                let index=tmodel.tap(pos[0],pos[1]);
                tmodel.selecting[0]=index;
                tmodel.selecting[1]=index;
                tmodel.render_selection();
                this.press=true;
            }
        }
        element_obj.onclick=function (event){
            event.stopPropagation();
            tmodel.customMenu.hide();
        }
        element_obj.ondblclick=function (event){
            event.stopPropagation();
            let pos=tmodel.get_rel_pos(event);
            let telement=tmodel.tap(pos[0],pos[1],undefined,true);
            if (!(typeof telement=='number')){
                tmodel.resizer.resize(telement);
            }
            this.press=false;
        }
        element_obj.onmousemove=function (event){
            event.stopPropagation();
            if(this.press){
                if(event.buttons){
                    if(!tmodel.resizer.onmousemove(event)){
                        let pos=tmodel.get_rel_pos(event);
                        //let index=tmodel.tap(event.pageX-this.offsetLeft-tmodel.padding[0],event.pageY-this.offsetTop-tmodel.padding[1]);
                        let index=tmodel.tap(pos[0],pos[1]);
                        tmodel.selecting[1]=index;
                        let selecting=[Math.min(tmodel.selecting[0],index),Math.max(tmodel.selecting[0],index)];
                        let telements=tmodel.telements;
                        for(let i=0;i<telements.length;i++){
                            let is_select=i>=selecting[0] && i<selecting[1];
                            telements[i].select(is_select);
                        }
                    }else tmodel.update_align();
                }else this.press=false;
            }
        }
        element_obj.onmouseup=function (event){
            event.stopPropagation();
            if(event.button==0 && this.press){
                if(!tmodel.resizer.onmouseup(event)){
                    //let rect=tmodel.displayer.getBoundingClientRect();
                    //let pos=[event.clientX-rect.left+tmodel.padding[0],event.clientY-rect.top+tmodel.padding[1]];
                    let pos=tmodel.get_rel_pos(event);
                    //let index=tmodel.tap(event.pageX-this.offsetLeft-5,event.pageY-this.offsetTop-5);
                    let index=tmodel.tap(pos[0],pos[1]);
                    tmodel.selecting=[Math.min(tmodel.selecting[0],index),Math.max(tmodel.selecting[0],index)];
                    tmodel.render_selection();
                    tmodel.index=index;
                    tmodel.show_inp();
                    inp_x=inp.offsetLeft;
                    if(tmodel.selecting[0]<tmodel.selecting[1])
                        tmodel.selectionbox.show(event.pageX,event.pageY);
                        //tmodel.selectionbox.show(event.clientX,event.clientY);
                    else tmodel.selectionbox.hide();
                }else tmodel.update_align();
            }else tmodel.selectionbox.hide();
            this.press=false;
        }
        this.index=0;      //-----------------------------------輸入位置
        this.selecting=[0,0];      //起始，終點
        this.text_dict={
            'type':'text',
            'fontSize':30,                                  //字大小
            'char':'c',                                        //文字
        };
        let inp=HtmlElement('input','style="position:absolute;width:1px;background-color:transparent;outline:none;border:transparent;"');
        let _inp=HtmlElement('span','style="color:black;display:inline-block;"');
        _inp.style.fontSize=this.text_dict['fontSize'];
        this._inp=_inp;
        let keypress=false;
        this.select_string='';
        this.select_dict=[];
        let inp_x=0;     //固定水平
        inp.addEventListener('paste', function (event) {
            event.stopPropagation();
            event.preventDefault();          // 阻止默認的貼上行為
            const pastedData = (event.clipboardData || window.clipboardData).getData('text');
            if(pastedData==tmodel.select_string){
                console.log('符合');
                let tdicts=tmodel.select_dict;
                for (let i=0;i<tdicts.length;i++){
                   // console.log(tdicts[i]);
                    tmodel.insert_telement(copy_dict(tdicts[i]));
                }
            }else{
                tmodel.insert_text(pastedData);
            }
        });
        inp.addEventListener('keydown',function(event){
            event.stopPropagation();
            if (event.ctrlKey) {
                //console.log('ctrl+'+event.code);
                if(tmodel.selecting[0]!=tmodel.selecting[1]){
                    if(event.code=='KeyC'){
                        navigator.clipboard.writeText(tmodel.get_selection());
                    }else if(event.code=='KeyX'){
                        navigator.clipboard.writeText(tmodel.get_selection());
                        tmodel.delect_selection();
                        tmodel.selecting[0]=tmodel.selecting[1];
                        tmodel.show_inp();
                    }
                }
                if(event.code=='KeyA'){
                    tmodel.index=tmodel.telements.length;
                    tmodel.selecting=[0,tmodel.index];
                    tmodel.render_selection();
                }
            }
            if (event.shiftKey) {
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
                            tmodel.show_inp();
                            inp_x=this.offsetLeft;
                        }else if(event.code=='ArrowRight'){
                            tmodel.index=selecting[1];
                            tmodel.show_inp();
                            inp_x=this.offsetLeft;
                        }else if(event.code=='ArrowUp'){
                            tmodel.index=tmodel.tap(this.offsetLeft,this.offsetTop-this.offsetHeight/2);
                            tmodel.show_inp();
                        }else if(event.code=='ArrowDown'){
                            tmodel.index=tmodel.tap(this.offsetLeft,this.offsetTop+this.offsetHeight*3/2);
                            tmodel.show_inp();
                        }
                        tmodel.selecting[0]=tmodel.selecting[1];
                        tmodel.render_selection();
                    }else if(event.code=='Enter'){
                        tmodel.delect_selection();tmodel.change_line();tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else if(event.code=='Backspace'){
                        tmodel.delect_selection();tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else if(event.code=='Delete'){
                        tmodel.delect_selection();tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else keypress=true;
                }else{
                    if(event.code=='ArrowLeft' && tmodel.index>0){
                        tmodel.index--;
                        if(tmodel.telements[tmodel.index].type=='br_space')
                            tmodel.index--;
                        tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else if(event.code=='ArrowRight' && tmodel.index<tmodel.telements.length){
                        tmodel.index++;
                        if(tmodel.telements[tmodel.index-1].type=='br_space')
                            tmodel.index++;
                        tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else if(event.code=='ArrowUp'){
                        tmodel.index=tmodel.tap(inp_x,this.offsetTop-this.offsetHeight/2);
                        tmodel.show_inp();
                    }else if(event.code=='ArrowDown'){
                        tmodel.index=tmodel.tap(inp_x,this.offsetTop+this.offsetHeight*3/2);
                        tmodel.show_inp();
                    }else if(event.code=='Enter'){
                        tmodel.change_line();
                        tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else if(event.code=='Backspace'){
                        tmodel.delete_telement();
                        tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else if(event.code=='Delete'){
                        tmodel.delete_telement('forward');
                        tmodel.show_inp();
                        inp_x=this.offsetLeft;
                    }else keypress=true;
                }
                //console.log('code: '+event.code);
            }
        });
        inp.addEventListener('input',function (event) {
            event.stopPropagation();
            if(keypress){
                if(tmodel.delect_selection())
                    tmodel.show_inp();
                let tem_html=convert_string(this.value);
                if(!event.isComposing && isASCII(tem_html)){
                    tmodel.insert_text(this.value);
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
            if(keypress){
                if (!event.isComposing) { //event.code == 'Enter' || 
                    //console.log()
                    tmodel.insert_text(this.value);
                    this.value='';
                    _inp.innerHTML='';
                    tmodel.show_inp();
                }
            }
            keypress=false;
        });
        this.inp=inp;
    }
    render_selection(){
        let selecting=[Math.min(this.selecting[0],this.selecting[1]),Math.max(this.selecting[0],this.selecting[1])];
        let telements=this.telements;
        for(let i=0;i<telements.length;i++){
            let is_select=i>=selecting[0] && i<selecting[1];
            telements[i].select(is_select);
        }
    }
    get_selection(){
        let selecting=this.selecting;
        let string='';
        let dict_box=[];
        let telements=this.telements;
        for(let i=0;i<telements.length;i++){
            if(i>=selecting[0] && i<selecting[1]){
                let tdict=telements[i].get_dict();
                if (tdict['type']=='text')
                    string+=tdict['char'];
                dict_box.push(tdict);
            }
        }
        if(dict_box.length>0){
            this.select_string=string;
            this.select_dict=dict_box;
            
        }
        return string;
    }
    new_tmodel(element_obj){
        return new TModel(element_obj);
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
    delect_selection(){
        let selecting=this.selecting;
        if(selecting[0]<selecting[1]){
            this.remove_inp();
            this.index=selecting[0];
            let times=selecting[1]-selecting[0];
            this.telements.splice(this.index,times);
            for (let i=0;i<times;i++){
                this.displayer.removeChild(this.displayer.children[this.index]);
            }
            this.selecting[1]=this.selecting[0];
            return true;
        }
        return false;
    }
    delete_telement_by_index(index){
        let element=this.displayer.children[index];
        this.telements.splice(index,1);
        this.displayer.removeChild(element);
    }
    delete_telement(direct='back'){
        this.remove_inp();
        if(direct=='back' && this.index>0){
            let telement=this.telements[this.index-1];
            this.delete_telement_by_index(this.index-1);
            //let element=this.displayer.children[this.index-1];
            //this.telements.splice(this.index-1,1);
            //this.displayer.removeChild(element);
            this.index--;
            if(telement.type=='br_space')
                this.delete_telement(direct);
        }else if(direct=='forward' && this.index<this.telements.length){
            let telement=this.telements[this.index];
            this.delete_telement_by_index(this.index);
            //let element=this.displayer.children[this.index];
            //this.telements.splice(this.index,1);
            //this.displayer.removeChild(element);
            if(telement.type=='br')
                this.delete_telement(direct);
        }
        this.update_align();
    }
    insert_telement(build_dict){
        if(build_dict['type']=='align'){
            let align=build_dict['align'];
            let tmodel=this;
            function remove_left(align){
                let l=tmodel.index-1;
                while (l>-1){
                    let telement=tmodel.telements[l];
                    if (telement.type=='br_space')
                        break;
                    if(telement.type=='align' && telement.bdict['align']==align){
                        tmodel.delete_telement_by_index(l);
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
                        tmodel.delete_telement_by_index(k);
                    }else k++;
                }
            }
            if(align=='left'){remove_left('center');remove_left('right');remove_left('left');
            }else if(align=='center'){remove_left('right');remove_left('center');remove_right('left');remove_right('center');
            }else if(align=='right'){remove_right('center');remove_right('right');remove_right('left');}
        }
        let telement=new TElement(this,build_dict);
        this.telements.splice(this.index, 0,telement);
        let all_chars=this.displayer.children;
        if(all_chars.length==0)
            this.displayer.appendChild(telement.element);
        else{
            if(this.index==0)
                this.displayer.insertBefore(telement.element,this.displayer.firstChild);
            else all_chars[this.index-1].after(telement.element);
        }
        this.update_align();
        this.index++;
    }
    remove_inp(){
        if(this.displayer.contains(this.inp))
            this.displayer.removeChild(this.inp);
        if(this.displayer.contains(this._inp))
            this.displayer.removeChild(this._inp);
    }
    get_rel_pos(event){
        let rect=this.displayer.getBoundingClientRect();
        let pos=[event.clientX-rect.left,event.clientY-rect.top];
       //console.log('rect:'+rect.left+','+rect.top);
       //console.log('padding:'+this.padding);
       //console.log('mouse:'+event.clientX+','+event.clientY);
       //console.log('pos:'+pos);
       //pos=[event.clientX,event.clientY]; 
       return pos
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
    get_dict(dtype,index=null){
        if(index==null)
            index=this.index;
        if (index>0){
            let k=index-1;
            while (k>-1){
                let _bdict=this.telements[k].get_dict();
                if(_bdict['type']==dtype){
                    return _bdict
                }
                k--;
            }
        }
        return this.text_dict;
    }
    get_text_dict(index=null){
        let bdict=this.get_dict('text',index);
        return bdict;
    }
    update_align(){
        let line_width=this.displayer.offsetWidth-this.padding[0]*2;
        let l=this.index;
        //-------------------------------------------------定位到最左邊
        while (l>0){
            let telement=this.telements[l];
            if (this.telements[l].type=='br_space')
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
                    telement.resize([csize,Math.round(this.get_text_dict()['fontSize'])]);
                    
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
                    telement.resize([rsize,Math.round(this.get_text_dict()['fontSize'])]);
                    w+=rsize+rw;
                    break;
                }
            }else{
                w+=telement.get_rect()[2];
            }
            l++;
        }

    }
    //------------------------------------------------------------------------------------------------------------------------------------------------------外部語法糖
    set_align(align){
        let bdict={'type':'align','align':align};
        this.insert_telement(bdict);
    }
    set_text_attr(B=null,I=null,U=null,S=null,fontSize=null,color=null,bgcolor=null){
        let ndict={};
        if(B!=null) ndict['B']=B;
        if(I!=null) ndict['I']=I;
        if(U!=null) ndict['U']=U;
        if(S!=null) ndict['S']=S;
        if(fontSize!=null) ndict['fontSize']=fontSize;
        if(color!=null) ndict['color']=color;
        if(bgcolor!=null) ndict['bgcolor']=bgcolor;
        let selecting=this.selecting;
        this.remove_inp();
        for(let i=selecting[0];i<selecting[1];i++){
            let telement=this.telements[i];
            telement.update(ndict);
        }
        //this.show_inp();
    }
    insert_html(html_code){
        let build_dict={'type':'html','code':html_code};
        this.insert_telement(build_dict);
    }
    insert_message(text_string,mdict){
        let fontSize=this.get_dict(this.input_mode[0])['fontSize'];
        let bdict={
            'type':'message',
            'text':text_string,
            'fontSize':fontSize,
            
        }
        for(const [key, value] of Object.entries(mdict))
            bdict[key]=value;
        this.insert_telement(bdict);
    }
    insert_eps(text_string){
        
        let bdict=this.get_dict('eps');
        let unit=this.input_mode[1];
        //console.log(unit);
        if(bdict['type']=='text')
            bdict={'type':'eps','fontSize':unit}
        for (let i=0;i<text_string.length;i++){
            let build_dict=copy_dict(bdict);
            let c=text_string[i];
            if (c=='\n')
                this.change_line();
            else{
                build_dict['char']=c;
                if(isASCII(c))
                    build_dict['scale']=unit/2+','+unit*4/3;
                else build_dict['scale']=unit+','+unit*4/3;
                this.insert_telement(build_dict);
            }
        }
    }
    insert_text(text_string,mdict=null){
        if(this.input_mode[0]!='text'){
            if(this.input_mode[0]=='eps')
                this.insert_eps(text_string);
            return;
        }
        let bdict=copy_dict(this.get_text_dict());
        if(mdict!=null){
            for(const [key, value] of Object.entries(mdict))
                bdict[key]=value;
        }
        for (let i=0;i<text_string.length;i++){
            let build_dict=copy_dict(bdict);
            let c=text_string[i];
            if (c=='\n')
                this.change_line();
            else{
                build_dict['char']=c;
                this.insert_telement(build_dict);
            }
        }
    }
    insert_image(src){
        let bdict={
            'type':'image',
            'src':src,
            'scale':'300,200'
        }
        this.insert_telement(bdict);
        this.show_inp();
    }
    insert_link(url,link_name){
        let bdict=copy_dict(this.get_text_dict());
        bdict['type']='link';
        bdict['href']=url;
        bdict['linkname']=link_name;
        bdict['U']=1;
        bdict['color']='blue';
        this.insert_telement(bdict);
        this.show_inp();
    }
    insert_table(row,cols){
        let bdict={
            'type':'table',
            'tsize':[row,cols]
        }
        this.insert_telement(bdict);
    }
    //----------------------------------------------------------------
    to_eps_middle(){
        let format=`
        一般文字:_字
        拉縮文字:<w,h>字
        對齊    :[l,c,r]
        變數    :k[id]_
        拉縮變數:k<w,h>[id]_
        換行    :n
        圖片    :ix,y,w,h,[url][空格]    #x,w,h為變形比例
        `;
        let unit=this.input_mode[1];
        //--------------------
        let code_box=[];
        let bottom=0;
        for(let i=0;i<this.telements.length;i++){
            let telement=this.telements[i];
            let rect=telement.get_rect();
            let bottom2=rect[1]+rect[3];
            if(bottom2>bottom && bottom>0){
                code_box.push('n');
                bottom=0;
            }else
            bottom=bottom2;
            let _dict=telement.get_dict();
            if(_dict['type']=='eps'){
                let rect=telement.get_rect();
                let w=Math.round(rect[2]*2/unit)/2;
                let h=Math.round(rect[3]*0.75/unit);
                if(!isASCII(_dict['char'])){
                    w=Math.round(w);
                    if(w==1 && h==1){
                        code_box.push('_'+_dict['char']);
                    }else code_box.push('<'+w+','+h+'>'+_dict['char']);
                }else{
                    if(w==0.5 && h==1){
                        code_box.push('_'+_dict['char']);
                    }else code_box.push('<'+Math.round(w*2)+','+h+'>'+_dict['char']);
                }
            }
            if(_dict['type']=='align'){
                code_box.push(_dict['align'][0]);
            }
            if(_dict['type']=='message'){
                code_box.push('k'+_dict['key']+'_');
            }
            if(_dict['type']=='image'){
                if(_dict['key'])
                    code_box.push('k'+_dict['key']+'_');
                else{
                    let line_width=this.displayer.offsetWidth-this.padding[0]*2;
                    
                    let x=(rect[0]-this.padding[0])/line_width;
                    let w=rect[2]/line_width;
                    let h=rect[3]/line_width;
                    code_box.push('i'+x+',0,'+w+','+h+','+telement.src+' ');
                }
            }
            if(_dict['type']=='br'){
                code_box.push('n');
                bottom=0;
            }
        }
        return code_box.join('');
    }
}
//---------------------------------------------------------------------------------------------------------------------------------快速使用
let collect_textctrls=document.getElementsByClassName('textctrl');
var textctrls=[];
for (let i=0;i<collect_textctrls.length;i++){
    textctrls.push(new TModel(collect_textctrls[i]));
}
export var tctrl=textctrls[0];


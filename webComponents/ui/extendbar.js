import { Dict_to_DString, DString_to_Dict, HtmlElement, VoidElement,Path,void_function,
    save_file, upload_file, upload_folder,html_img} from "../tool.js";
import { ContextMenu } from "./base.js";


class Bar{
    constructor(extendbar,path,onclick,unclick){
      //基本參數
      this.extendbar=extendbar;
      this.is_selected=false;       //是否正被選定
      this.data='';                //自身資料
      //------------------------------------------------------設定可用參數
      path=new Path(path);
      //let parentpath=path.parentpath;
      let name=path.get(-1);
      //---------------------------------------------------------------------建構元素
      let bar=this;
      let container=HtmlElement('div',`position:relative;width:100%;`);
      let label=HtmlElement('div','width:100%;color:white;cursor:pointer;overflow:hidden');
      //----------------------------------------------------當這個bar被點擊
      label.onclick=function (event){
        event.stopPropagation();
        //customMenu.hide();
        bar.onclick(event);       //自身點擊事件
      }
      label.addEventListener('contextmenu', function(event){
        bar.focus();
        if(extendbar!=null)
        extendbar.customMenu.show('extendbar',event);
      });
      //被點擊時不可選定文字
      label.addEventListener('selectstart', (event) => {event.preventDefault();});
      container.appendChild(label);
      //------------------------------------
      this.container=container;
      this.label=label;
      this.name=name;
      this.path=path;
      //-----------------------------------設定label
      this.label_items=[];
      //console.log(5+20*(path.length-1));
      this.insert_label_item('void',VoidElement((5+20*(path.length-1))+'px'));
      this.insert_label_item('name',HtmlElement('div','font-family:Arial;display:inline-block;font-size:25px;white-space: nowrap;max-width:100px;',name));
      //----------------------------------登記自己
      this.parent=null;
      if(path.path!=''){
        this.parent=extendbar.getbar(path.parent);
        this.parent.listdir[name]=this;
        this.parent.content.appendChild(container);
        if(onclick==null) onclick=this.parent.bar_onclick;
        if(unclick==null) unclick=this.parent.bar_unclick;
      }
      this.bar_onclick=onclick;
      this.bar_unclick=unclick;
    }
    //獲取當前路徑
    get_path(){
        let box=[this.name];
        let pt=this.parent;
        while (pt!=null && pt.name!=''){
            box.splice(0,0,pt.name);
            pt=pt.parent;
        }
        return box.join('/');
    }
    //在自身label中加入物件
    insert_label_item(key,element,index=null){
        if(index==null) index=this.label_items.length;
        this.label_items.splice(index,0,[key,element]);
        this.label.innerHTML='';
        for(let i=0;i<this.label_items.length;i++)
            this.label.appendChild(this.label_items[i][1]);
    }
    //刪除自身
    delete(){
        if(this.parent!=null){
            delete this.parent.listdir[this.name];
            this.parent.content.removeChild(this.container);
            this.parent=null;
        }
    }
    //重新命名
    rename(name){
        if(!name.includes('/') && !name.includes('\\')){
            //修改標籤
            for(let i=0;i<this.label_items.length;i++){
                if(this.label_items[i][0]=='name')
                    this.label_items[i][1].innerHTML=name;
            }
            //更改登記
            if(this.parent!=null){
                delete this.parent.listdir[this.name];
                this.parent.listdir[name]=this;
            }
            this.name=name;
        }
    }
    //隱藏bar label
    hide_label(){
        this.label.style.overflow='hidden';
        this.label.style.height='0px';
    }
    //自身被鎖定(滑鼠任意鍵)
    focus(){
        this.extendbar.unclick();
        this.extendbar.nowpath=this.get_path();
        this.label.style.backgroundColor='grey';
        this.is_selected=true;
    }
    //取消自身被鎖定狀態
    unfocus(){
        if(this.is_selected){
            this.is_selected=false;
            this.label.style.backgroundColor='transparent';
        }
    }
    //自身名條被點擊時觸發(滑鼠左鍵)
    onclick(event){
        this.focus();
    }
    //自身原被選擇，但被取消選擇時觸發
    unclick(){
        this.unfocus();
    }
    //將自身轉為字串
    ToString(){
        return this.data;
    }
    //載入資料
    LoadString(BString){
        this.data=BString;
    }
}
class FolderBar extends Bar{
    constructor(extendbar,path,onclick=null,unclick=null,barstring=''){
        super(extendbar,path,onclick,unclick);
        //----------------------------------------------------修改bar_div
        //將旋轉提示加入 bar 標籤
        let rotate_div=HtmlElement('div','display:inline-block;font-size:25px;transform:scale(0.5,1);','>');
        this.insert_label_item('space',document.createTextNode(' '),1);
        this.insert_label_item('rotate_btn',rotate_div,1);
        this.rotate_div=rotate_div;
        //新增bar content
        let content=HtmlElement('div','overflow:hidden;height:0px;');
        this.container.appendChild(content);
        this.content=content;
        //---------------------------------------------
        this.expand_status=false;  //當前展開狀態
        this.listdir={};
        this.type='folder';
        //----------------------------------------------------
        if(barstring!='') this.LoadString(barstring);
    }
    focus(){
        super.focus();
        this.extendbar.folderpath=this.get_path();
    }
    onclick(event){
        super.onclick(event);
        this.expand_status=!this.expand_status;
        this.expand();
    }
    unclick(){
        for(const [barname,bar] of Object.entries(this.listdir)) bar.unclick();
        super.unclick();
    }
    add_folder(folderpath,bar_onclick=null,bar_unclick=null){
        let fpath=new Path(folderpath);
        let parentbar=this.getbar(fpath.get_range(0,-1),true);
        if(bar_onclick==null) bar_onclick=parentbar.bar_onclick;
        if(bar_unclick==null) bar_unclick=parentbar.bar_unclick;
        if(parentbar.listdir[fpath.get(-1)]==undefined){
            new FolderBar(this.extendbar,folderpath,bar_onclick,bar_unclick);
            //parentbar.content.appendChild(folder.container);
            //parentbar.listdir[fpath.get(-1)]=folder;    //登記
        }
    }
    //添加檔案
    add_file(filepath,data=''){
        let fpath=new Path(filepath);
        let parentbar=this.getbar(fpath.get_range(0,-1),true);
        if(parentbar.listdir[fpath.get(-1)]==undefined){
            new FileBar(this.extendbar,filepath,parentbar.bar_onclick,parentbar.bar_unclick,data);
            //parentbar.content.appendChild(file.container);
            //parentbar.listdir[fpath.get(-1)]=file;    //登記
        }
    }
    //獲取某路徑的bar
    getbar(path,createfolder=false){   //createfolder:若該路徑不存在，是否強制建立
        if(path=='') return this;
        let fpath=new Path(path);let k=0;let fb=this;
        //console.log('path:',path);
        while (k<fpath.length){
            fb=fb.listdir[fpath.get(k)];
            if(fb==undefined){
                if(createfolder) fb=new FolderBar(this.extendbar,fpath.get_range(0,k+1))
            }
            k++;
        }
        return fb;
    }
    //拓展或閉合自身
    expand(expand=null){
        if(expand==null) expand=this.expand_status;
        else this.expand_status=expand;
        if(expand){
            this.content.style.height='auto';
            this.rotate_div.style.transform='scale(1,0.5) rotate(90deg)';
        }
        else{
            this.content.style.height='0px';
            this.rotate_div.style.transform='scale(0.5,1)';
        }
    }
    //設定資料
    set_data(path,data){
        let bar=this.getbar(path);
        bar.data=data;
    }
    //獲取檔案或資料夾資料
    get_data(path){
        let bar=this.getbar(path);
        return bar.data;
    }
    //將自身轉為字串
    ToString(){
        let _dict={'':this.data};
        for(const [name,bar] of Object.entries(this.listdir)){
            if(bar.type=='folder') _dict['0'+name]=bar.ToString();
            else _dict['1'+name]=bar.ToString();
        }
        return Dict_to_DString(_dict);
    }
    //載入資料
    LoadString(BarString){
        let _dict=DString_to_Dict(BarString);
        //清空自身所有子元素
        this.listdir={};
        this.content.innerHTML='';
        //--------------------------------------------------開始加入
        let path=this.get_path();     //子元素母路徑
        if(path!='') path+='/';
        for(const [key,barstring] of Object.entries(_dict)){
            if(key=='') this.data=barstring;
            else{
                let name=key.substring(1);
                if(key[0]=='0') new FolderBar(this.extendbar,path+name,this.bar_onclick,this.bar_unclick,barstring);
                else new FileBar(this.extendbar,path+name,this.bar_onclick,this.bar_unclick,barstring);
                
            }
        }
        this.data=_dict[''];

    }
}
//點擊事件會傳入bar自己
// onclick(event,bar)
// unclick(bar)
class FileBar extends Bar{
    constructor(extendbar,path='',onclick=null,unclick=null,data=''){
        super(extendbar,path,onclick,unclick);
       // this.bar_onclick=onclick;
       // this.bar_unclick=unclick;
        this.data=data;
        this.type='file';
    }
    focus(){
        super.focus();
        this.extendbar.folderpath=this.parent.get_path();
    }
    onclick(event){
        super.onclick(event);
        if(this.bar_onclick!=null) this.bar_onclick(event,this);
    }
    unclick(){
        
        if(this.is_selected){
            if(this.bar_unclick!=null) this.bar_unclick(this);
            super.unclick();
        }
    }
}

export class ExtendBar extends FolderBar{
    constructor(parent,pos,size){
        super(null,'',void_function,void_function);
        this.extendbar=this;
        //this.mainbar=new FolderBar(this,'',void_function,void_function);
        this.container.style=`position:relative;left:${pos[0]};top:${pos[1]};width:${size[0]};height:${size[1]}`;
        //-------------------------------------------------加入parent
        this._element=this.container;
        parent.appendChild(this);
        //-------------------------------------------------
        this.folderpath='';  //要新增內容的資料夾路徑
        this.nowpath='';    // 當前路徑
        //------------------------------------------新增 inp
        let eb=this;
        let input_div=HtmlElement('div','width:100%;');
        input_div.params=[null,void_function];  //input_div目前位於的bar,input被enter後的callback
        input_div.appendChild(HtmlElement('input','font-family:Arial;position:relative;font-size:25px;color:white;outline:none;border:transparent;background-color:transparent;'));
        input_div.firstChild.addEventListener('keypress',function (event){
          if(event.key === "Enter"){
            input_div.params[1](input_div.firstChild.value);
            eb.close_input();
          }
        });
        this.input_div=input_div;
        this.expand(true);
        //-----------------------------------------------------------------
        let customMenu=new ContextMenu(parent);
        customMenu.addMenu(0,'extendbar',[
            ['新增&ensp;&ensp;▶','new_bar','hover'],
            'hr',
            ['上傳&ensp;&ensp;▶','upload_bar','hover'],
            ['下載',function (event){
                let bar=eb.getbar();
                save_file(bar.name,bar.ToString(),'text');
            }],
            'hr',
            ['貼上',function (event){}],
            ['複製',function (event){}],
            ['剪下',function (event){}],
            'hr',
            ['重新命名',function (event){}],
            ['刪除',function (event){}],
        ]);
        customMenu.addMenu(1,'new_bar',[
            ['檔案',function(event){eb.set_addfile_btn('',null,true);}],
            ['資料夾',function(event){eb.set_addfolder_btn('',null,null,true)}]
        ]);
        customMenu.addMenu(1,'upload_bar',[
            ['檔案',function(event){
                upload_file(function(file){
                    eb.add_file(eb.folderpath+'/'+file.name);
                });
            }],
            ['資料夾',function(event){
                upload_folder(function(files){
                    for(const file of files){
                        eb.add_file(eb.folderpath+'/'+file.webkitRelativePath);
                    }
                })
            }],
        ]);
        this.customMenu=customMenu;
    }
    getbar(path=null,createfolder=false){
        if(path==null) path=this.nowpath;
        return super.getbar(path,createfolder);
    }
    //關閉輸入框
    close_input(){
        if(this.input_div.params[0]!=null){
          this.input_div.params[0].removeChild(this.input_div);
          this.input_div.params[0]=null;
        }
    }
    //在某個資料夾底下新增某物
    new_input(folderpath,callback){
        this.close_input();
        let fpath=new Path(folderpath);
        let nowbar=this.getbar(folderpath);
        //console.log(nowbar==this);
        let xoffset=5+20*(fpath.length);
        let input=this.input_div.firstChild;
        input.value='';
        input.style.left=xoffset+'px';
        //console.log((this.mainbar.offsetWidth-xoffset));
        input.style.width=(this.container.offsetWidth-xoffset-5)+'px';
        this.input_div.params[1]=callback;
        nowbar.content.appendChild(this.input_div);
        nowbar.expand(true);
        this.input_div.params[0]=nowbar.content;
        input.focus();
    }
    
    //設定 新增資料夾的按鈕
    set_addfolder_btn(path,bar_onclick=null,bar_unclick=null,run=false){  //run:是否直接執行
        let eb=this;
        let f=function (event){
            let folderpath=eb.folderpath;
            if(folderpath=='') folderpath=path;
              eb.new_input(folderpath,function (value){
                //建立並選定
                let newfolderpath=folderpath+'/'+value.replace('\\','/');
                eb.add_folder(newfolderpath,bar_onclick,bar_unclick);
                //eb.getbar(newfolderpath).onclick();
            });
        }
        if(run) f(0);
        else this.set_btn(path,'folder_plus',f);
    }
    //設定 新增檔案的按鈕，觸發創建檔案的事件
    set_addfile_btn(path,newfile_event=null,run=false){   //run:是否直接執行
        let eb=this;
        let f=function (event){
            let folderpath=eb.folderpath;
            if(folderpath=='') folderpath=path;
              eb.new_input(folderpath,function (value){
                //建立並選定
                let newfilepath=folderpath+'/'+value.replace('\\','/');
                eb.add_file(newfilepath);
                let file=eb.getbar(newfilepath);
                if (newfile_event!=null) newfile_event(file);
                file.onclick();
            });
        }
        if(run) f(0);
        else this.set_btn(path,'file_plus',f);
    }
    //設定 下載檔案的按鈕，觸發創建檔案的事件
    set_download_btn(path){
        let eb=this;
        this.set_btn(path,'download2',function (event){
            let bar=eb.getbar(path);
            save_file(bar.name,bar.ToString(),'text');
        });
    }
    //為某個bar右方新增新功能圖標
    set_btn(path,img_src,callback){
        let estyle='position:relative;top:5px;display:inline-block;background-color:transparent;border:none;cursor:pointer;float:right;';
        let bar=this.getbar(path);
        let btn=HtmlElement('button',estyle,html_img(img_src,[null,25]));
        btn.onclick=function (event){
            event.stopPropagation();
            callback(event);
//            eb.new_input(eb.now_path,function (value){
  //            eb.add_bar(eb.now_path+'/'+value.replace('\\','/'),item_onclick,dtype);
        };
        bar.insert_label_item(img_src,btn);
    }
    set_content_color(folderpath,color){
        let bar=this.getbar(folderpath);
        bar.content.style.backgroundColor=color;
    }
}
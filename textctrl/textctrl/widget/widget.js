import { HtmlElement,add_css} from "../tool.js";
let navbar_css=`.textctrlNAV {
  list-style-type: none;
  background-color: #333;
  position: fixed;
  left: 0px;
  top: 0px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.textctrlNAV li {
  float: left;
  cursor:pointer;
}

.textctrlNAV a, .textctrlNAV-dropbtn {
  display: inline-block;
  color: white;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
}

/*
.textctrlNAV a:hover, .textctrlNAV-dropdown:hover .textctrlNAV-dropbtn {
  background-color: red;
}*/

.textctrlNAV.textctrlNAV-dropdown {
  display: inline-block;
}

.textctrlNAV-dropdown-content {
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
}

.textctrlNAV-dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  text-align: left;
}
.textctrlNAV-dropdown-content a:hover {background-color: #f1f1f1;}
.textctrlNAV-dropdown:hover .textctrlNAV-dropdown-content {
  display: block;
}
`;
add_css(navbar_css);
export class NavBar{
    constructor(){
        let nav=document.createElement('nav');
        nav.classList.add('textctrlNAV');
        this.left_div=document.createElement('div');
        this.left_div.style="display: flex;align-items: center ;";
        this.right_div=document.createElement('div');
        this.right_div.style="display: flex;align-items: center ;";
        nav.appendChild(this.left_div);
        nav.appendChild(this.right_div);
        document.body.appendChild(nav);
    }
    add_item(name,onclick=null,fontSize=null,end=false){
        let li=document.createElement('li');
        let a=document.createElement('a');
        if(fontSize==null)
            fontSize=16;
        a.style.fontSize=fontSize+'px';
        a.innerHTML=name;
        if(onclick!=null)
            a.onclick=onclick;
        li.appendChild(a);
        if(end) this.right_div.appendChild(li);
        else this.left_div.appendChild(li);
    }
    add_dropdown(name,items_list,item_width=null,end=false){
        let li=document.createElement('li');
        li.classList.add('textctrlNAV-dropdown');
        
        let a=document.createElement('a');
        a.classList.add('textctrlNAV-dropbtn');
        a.innerHTML=name;
        li.appendChild(a);
        let div=document.createElement('div');
        div.classList.add('textctrlNAV-dropdown-content');
        if(item_width!=null)
            div.style.width=item_width+'px';
        for(let i=0;i<items_list.length;i++){
            let item=items_list[i];
            let ia;
            if(item=='hr'){
                ia=document.createElement('hr');
            }else{
                ia=document.createElement('a');
                ia.innerHTML=item[0];
                if(item.length>=2)
                    ia.onclick=item[1];
            }
            div.appendChild(ia);
        }
        li.appendChild(div);
        if(end) this.right_div.appendChild(li);
        else this.left_div.appendChild(li);
    }
}
let model_css=`
.textctrlModal {
      display: none; /* 初始隱藏 */
      position: fixed;
      z-index: 1;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.4); /* 半透明黑色背景 */
    }
    /* 模態內容 */
    .textctrlModal-content {
      background-color: #fff;
      margin: 10% auto;
      padding: 0;
      border: 1px solid #888;
      width: 80%;
      max-width: 500px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
    }

    /* 標題 */
    .textctrlModal-header {
      padding: 15px;
      border-bottom: 1px solid #ddd;
      font-size: 18px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
    }

    /* 內容 */
    .textctrlModal-body {
      padding: 20px;
      font-size: 16px;
    }

    /* footer區域 */
    .textctrlModal-footer {
      padding: 15px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* 按鈕樣式 */
    .textctrlModal_btn {
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      border: none;
      border-radius: 4px;
    }

    .textctrlModal_btn-cancel {
      background-color: #ccc;
    }

    .textctrlModal_btn-confirm {
      background-color: #4CAF50;
      color: white;
    }

    /* 關閉按鈕 */
    .textctrlModal_close {
      color: #aaa;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
    }
    
    .textctrlModal_close:hover,
    .textctrlModal_close:focus {
      color: #000;
      text-decoration: none;
      cursor: pointer;
    }
`;
function doc_obj(tag,classname,innerHTML=''){
  let div_obj=document.createElement(tag);
  let classnames=classname.split(' ');
  for (let i=0;i<classnames.length;i++)
      div_obj.classList.add(classnames[i]);
  if(innerHTML.length>0)
    div_obj.innerHTML=innerHTML;
  return div_obj;
}
add_css(model_css);
export class TextctrlModal{
  constructor(title,contentHTML,check_func=null){
    function close_modal(){modal.style.display = "none";}
    let modal=doc_obj('div','textctrlModal');
    modal.style.display = "none";
    //------------------------------
    let modal_content=doc_obj('div','textctrlModal-content');
    
    let modal_header=doc_obj('div','textctrlModal-header');
    modal_header.innerHTML=`<span>${title}</span>`;
    let _close=doc_obj('span','textctrlModal_close','&times;');
    _close.onclick=close_modal;
    modal_header.appendChild(_close);
    modal_content.appendChild(modal_header);


    let modal_body=doc_obj('div','textctrlModal-body');
    modal_body.innerHTML=contentHTML;
    modal_content.appendChild(modal_body);

    let modal_footer=doc_obj('div','textctrlModal-footer');
    let canel_btn=doc_obj('button','textctrlModal_btn textctrlModal_btn-cancel');
    canel_btn.onclick =close_modal;
    modal_footer.appendChild(canel_btn);
    if(check_func==null) canel_btn.innerHTML='關閉'; 
    else{
      canel_btn.innerHTML='取消'; 
      let check_btn=doc_obj('button','textctrlModal_btn textctrlModal_btn-confirm','確認');
      check_btn.onclick=function (){
        check_func();
        modal.style.display = "none";
      }
      modal_footer.appendChild(check_btn);
    }
    modal_content.appendChild(modal_footer);
    modal.appendChild(modal_content);
    document.body.appendChild(modal);
    this.modal=modal;
  }
  launch(){
    this.modal.style.display = "block";
  }
}

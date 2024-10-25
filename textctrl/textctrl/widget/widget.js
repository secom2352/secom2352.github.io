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
    add_dropdown(name,items_list,width=null,end=false){
        let li=document.createElement('li');
        li.classList.add('textctrlNAV-dropdown');
        
        let a=document.createElement('a');
        a.classList.add('textctrlNAV-dropbtn');
        a.innerHTML=name;
        li.appendChild(a);
        let div=document.createElement('div');
        div.classList.add('textctrlNAV-dropdown-content');
        if(width!=null)
            div.style.width=width+'px';
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
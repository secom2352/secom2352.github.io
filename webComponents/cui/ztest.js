import {body} from "./base.js";

//let a=new Div(body,{'height':'100px',
//    'display':'inline-block',
//    'width':'100px','background-color':'red'});
//let b=new Div(body,{'display':'inline-block','height':'50px','width':'100px','background-color':'yellow'});
//let c=new Div(body,{'display':'inline-block','height':'100px','width':'100px','background-color':'blue'});
body.setInnerHTML(`
    <div style='width:100px;height:200px;background-color:red;'>文字 </div>
    <div style='display:inline-block;width:100px;height:50px;background-color:yellow;'></div>
    <div style='display:inline-block;width:100px;height:100px;background-color:blue;'></div>
`);
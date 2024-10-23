import {add_script} from './tool.js';

//add_script('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
//add_script('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
//import * as html2canvas from './document/html2canvas.min.js';
add_script('./textctrl/document/jspdf.umd.min.js');
add_script('./textctrl/document/html2canvas.min.js');

export function html_to_pdf(id,pdfname){
    const { jsPDF } = window.jspdf;
    let e=document.getElementById(id);
    let tem_border=e.style.border;
    e.style.border='0px';
    console.log('元素:'+e.offsetWidth+','+e.offsetHeight);
    html2canvas(document.querySelector("#"+id),{useCORS:true,scale: 4}).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        //const link = document.createElement('a');
        //link.href = imgData;
        //link.download = 'html_snapshot.png';
        //link.click();
        var doc = new jsPDF(1,'mm',[595,842]);
        console.log('canvas:'+canvas.width+','+canvas.height);
        doc.addImage(imgData, 'JPEG', 0, 0, 595, Math.round(595*canvas.height/canvas.width));
        doc.save(pdfname);
        e.style.border=tem_border;
    });
}
export function html_to_png(id,pngname){
    let e=document.getElementById(id);
    let tem_border=e.style.border;
    e.style.border='0px';
    console.log('元素:'+e.offsetWidth+','+e.offsetHeight);
    html2canvas(document.querySelector("#"+id),{useCORS:true,scale: 4}).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = imgData;
        link.download = pngname;
        link.click();
        e.style.border=tem_border;
    });
}
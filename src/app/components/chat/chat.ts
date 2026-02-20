import { Component } from '@angular/core';
import { MensajeChat } from '../../../models/chat';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {

  nombre : string ="Fabian David Torres F."
  email : string = "fabiantfandi@gmail.com"
  mensajes: MensajeChat[] = []
  cargandoHistorial = false
  asistenteEscribiendo = false
  mensajeTexto = ""
  enviandoMensaje = false
  manejoErrorImagen() {

  }
  cerrarSesion(){

  }
  trackByMensaje(index: number, mensaje: MensajeChat){
  }
  formatearMensajeAsistente(mensaje : string){

  }

  ngOnInit(){
    this.mensajes = this.generarMensajeDemo();
  }
  enviarMensaje(){

  }

  private generarMensajeDemo():MensajeChat[]{
    const ahora = new Date();

    return [
      {
        id:'id1',
        contenido:'Hola eres el asistente?',
        tipo:'Usuario',
        fechaEnvio: new Date(ahora.getTime()),
        estado:'Enviado',
        usuarioId:'u1'
      },{
        id:'id2',
        contenido:'Hola soy tu asistente',
        tipo:'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado:'Enviado',
        usuarioId:'a1'
      },{
        id:'id3',
        contenido:'Me puedes resolver una multiplicacion',
        tipo:'Usuario',
        fechaEnvio: new Date(ahora.getTime()),
        estado:'Enviado',
        usuarioId:'u2'
      },{
        id:'id4',
        contenido:'Claro aqui estoy para ayudarte',
        tipo:'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado:'Enviado',
        usuarioId:'a2'
      },{
        id:'id5',
        contenido:'Cuanto es 7x87',
        tipo:'Usuario',
        fechaEnvio: new Date(ahora.getTime()),
        estado:'Enviado',
        usuarioId:'u3'
      },{
        id:'id6',
        contenido:'El resultado de la mulltiplicacion es: 609',
        tipo:'Asistente',
        fechaEnvio: new Date(ahora.getTime()),
        estado:'Enviado',
        usuarioId:'a3'
      },

    ]
  }

}

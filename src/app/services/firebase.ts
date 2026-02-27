import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, collection } from '@angular/fire/firestore';
import {MensajeChat} from '../../models/chat'
import { addDoc } from 'firebase/firestore';


@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private firestore = inject(Firestore)

  //funcion para guargar el mensaje

  async guardarMensaje(mensaje: MensajeChat): Promise<void>{
    try{
      //revisar si viene sin usuarioId
      if(!mensaje.usuarioId){
        //devuelvo que el mensaje debe tener un usuario id
        throw new Error('Usuario Id es requerido');
      }else if(!mensaje.contenido){
        throw new Error('El contenido es requerido');
      }else if(!mensaje.tipo){
        throw new Error('El tipo es requerido');
      }

      const coleccionMensajes = collection(this.firestore, 'Mensajes')
      //preparar el mensaje
      const mensajeGuardar = {
        usuarioId : mensaje.usuarioId,
        contenido : mensaje.contenido,
        tipo : mensaje.tipo,
        estado : mensaje.estado,
        //fecha es de tipo TimeStamp y necesito pasarla a date
        fechaEnvio : Timestamp.fromDate(mensaje.fechaEnvio)
      };

      //añadir el mensaje a la colleccion, generar un documento en la colleccion
      const docRef = await addDoc(coleccionMensajes, mensajeGuardar)

    }catch(error: any){
      console.log('✖️Error al guardar el mensaje en firestore')
      console.log('Error details',{
        mensaje : error.messaje,
        code : error.code,
        stack : error.stack
      })

    }


  }
  obtenerMensajesUsuario(userId: int): observable${

  //filtrara que los mensajes que se muestran sean los mensajes del usuario

  }

}

import { Injectable, inject } from '@angular/core';
import { Firestore,
  Timestamp,
  collection,
  addDoc,
  query,
  where,
  QuerySnapshot,
  DocumentData,
  onSnapshot} from '@angular/fire/firestore';
import {ConversacionChat, MensajeChat} from '../../models/chat'
import { Observable } from 'rxjs';





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
  //filtrara que los mensajes que se muestran sean los mensajes del usuario
  obtenerMensajesUsuario(usuarioId : string): Observable<MensajeChat[]>{
    return new Observable ( observer =>{

      const consulta = query(
        collection(this.firestore, 'mensajes'),
        where('usuarioId', "==", usuarioId)

      )
      const unSubscribe = onSnapshot(
        consulta,
        (snapshot: QuerySnapshot<DocumentData>)=>{
          const mensajes : MensajeChat[] = snapshot.docs.map(doc =>{
            const data = doc.data();
            return{
              id: doc.id,
              usuarioId: data['usuarioId'],
              contenido: data['contenido'],
              estado: data['estado'],
              tipo: data['tipo'],
              //recordamos que firebase guarda timestamp y angular guarda date conversion
              fechaEnvio: data['fechaEnvio'].toDate()
            } as MensajeChat;
          });

          //ordenar los mensajes del mas reciente al mas antiguo.
          mensajes.sort((a, b)=> a.fechaEnvio.getTime() - b.fechaEnvio.getTime())

          observer.next(mensajes);
        },
        error =>{
          console.error('Error al escuchar los mensajes');
          observer.error(error);
        }
      );
      //se retorna una des suscripcion a el servicio
      return()=>{
        unSubscribe;
      }


    });

    //gestionar obtener el id del usuario por medio de un mensaje

  }
 //guardar la conversacion

 async guardarConversacion(conversacion: ConversacionChat): Promise<void>{
  try{
    const colleccionConversaciones = collection(this.firestore, 'conversaciones')
    //preparar las conversaciones para enviarlas a firestore
    const conversacionParaGuardar={
      ...conversacion,
      fechaCreacion: Timestamp.fromDate(conversacion.fechaCreacion),
      ultimaActividad: Timestamp.fromDate(conversacion.ultimaActividad),
      //conversion de la fecha envio del MensajeChat
      mensajes: conversacion.mensajes.map( mensaje =>({
        ...mensaje,
        fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
      }))
    };
    await addDoc(colleccionConversaciones, conversacionParaGuardar);
  }catch(error){
    console.error('Error al guardar la conversacion', error)
    throw error;
  }
 }

}

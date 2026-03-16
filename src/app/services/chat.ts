import { Injectable, inject} from '@angular/core';
import { MensajeChat } from '../../models/chat';
import { AuthService } from './auth';
import { FirebaseService } from './firebase';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { FirestoreError } from 'firebase/firestore/lite';
import { GeminiService } from './gemini';



@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private authService = inject(AuthService)

  private geminiService = inject(GeminiService)

  private firebaseService = inject(FirebaseService)

  private mensajeSubject = new BehaviorSubject<MensajeChat[]>([])

  public mensajes$ = this.mensajeSubject.asObservable();

  private cargandoHistorial = false;

  private asisenteRespondiendo = new BehaviorSubject<boolean>(false);
  public asistenteRespondiendo$ = this.asisenteRespondiendo.asObservable();

  async InicializarChat(usuarioId: string): Promise<void>{
    if(this.cargandoHistorial){
      return;
    }
    this.cargandoHistorial = true;
    try{
      this.firebaseService.obtenerMensajesUsuario(usuarioId).subscribe({
        next : (mensajes)=>{
          //actualizando el BehaviorSubject
          this.mensajeSubject.next(mensajes)
          this.cargandoHistorial = false;
        },
        error: (error)=>{
          console.error("Error al cargar el historial", error)
          this.cargandoHistorial = false;
          //cargar con una lista vacia el BehaviorSubject
          this.mensajeSubject.next([]);

        }
      })
    }catch(error){
      console.error('Error al cargar el historial', error)
      this.cargandoHistorial = false;
      this.mensajeSubject.next([]);
      throw error;
    }

  }

  async enviarMensaje(contenidoMensaje : string):Promise<void>{
    const usuarioActual = this.authService.obtenerUsuario()
    if(!usuarioActual){
      console.error('No hay un usuario autenticando');
      throw Error;
    }
    if(!contenidoMensaje.trim()){
      return ;
    }
    const mensajeUsuario: MensajeChat={
      usuarioId: usuarioActual.uid,
      contenido: contenidoMensaje.trim(),
      fechaEnvio: new Date(),
      estado: 'Enviado',
      tipo: 'Usuario'
    }
    try {
      const mensajeDelUsuario = this.mensajeSubject.value;
      const nuevoMensajeEncontrado = [...mensajeDelUsuario,mensajeUsuario]
      this.mensajeSubject.next(nuevoMensajeEncontrado)
      try{
          await this.firebaseService.guardarMensaje(mensajeUsuario);
      }catch(firestoreError){

        console.error('No se pudo guardar el mensaje', firestoreError)
      }

      this.asisenteRespondiendo.next(true)

      const mensajesActuales = this.mensajeSubject.value;



      const historialParaGemini = this.geminiService.convertirHistorialGemini(
        mensajesActuales.slice(-6)
      );

      const respuestaDelAsistente = await firstValueFrom(
        this.geminiService.enviarMensaje(contenidoMensaje, historialParaGemini)
      )
        //Configurar los mensajes del asistente

        const mensajeAsistente:MensajeChat={

          usuarioId: usuarioActual.uid,
          contenido: respuestaDelAsistente,
          fechaEnvio: new Date(),
          estado: 'Enviado',
          tipo: 'Asistente'

        }

        const mensajesActualizados = this.mensajeSubject.value
        const nuevoMensajeEncontradoAsis=[...mensajesActualizados, mensajeAsistente]
        this.mensajeSubject.next(nuevoMensajeEncontradoAsis);

        try {
          await this.firebaseService.guardarMensaje(mensajeAsistente)
        }catch(firestoreError){
          console.log('No se pudo guardar el mensaje del asistente', firestoreError)
        }


    }catch(error){
      console.error('error al procesar el mensaje', error)

      const mensajeError:MensajeChat={
      usuarioId:usuarioActual.uid,
      contenido:'Lo sentimos no se pudo procesar el mensaje',
      fechaEnvio: new Date(),
      estado: 'Error',
      tipo: 'Asistente'

    };
    try{
      await this.firebaseService.guardarMensaje(mensajeError);
    }catch(saveError){
      console.error(' Error al guardar el mensaje de error', saveError)
      const mensajeActual = this.mensajeSubject.value;
      this.mensajeSubject.next([...mensajeActual,mensajeError]);
    }
    throw error;
    }finally{
      this.asisenteRespondiendo.next(false)
    }

  }

  limpiarChat(): void{
    this.mensajeSubject.next([])
  }

  obtenerMensajes(): MensajeChat[]{
    return this.mensajeSubject.value
  }
}

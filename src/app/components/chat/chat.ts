import { Component,
  ViewChild,
  ElementRef ,
  inject,
  OnDestroy,
  AfterViewChecked,
  OnInit} from '@angular/core';
import { MensajeChat } from '../../../models/chat';
import {FormsModule} from '@angular/forms'
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked  {

  private authService = inject(AuthService)
  private chatService = inject(ChatService)
  private router = inject(Router)

  @ViewChild('messagesContainer') messagesContainer! : ElementRef
  @ViewChild('mensajeInput') mensajeInput! : ElementRef

  usuario: User | null = null;
  mensajes: MensajeChat[]=[]
  cargandoHistorial=false
  asistenteEscribiendo=false
  enviandoMensaje=false
  mensajeTexto=""
  mensajeError="";

  private suscripciones : Subscription[]=[]

  private async verificarAutenticacion():Promise<void>{
    // a la variable usuario le voyt a asignar el servicio de auth y la funcion  se obtiene
    this.usuario = this.authService.obtenerUsuario()

    if(!this.usuario){
      await this.router.navigate(['/auth'])
      throw new Error ('Usuario no autenticado')
    }
    console.log('Ingreso a verificar autentificacion')
  }
  private async inicializarChat(): Promise<void>{
    if (!this.usuario){
      return;
    }
    this.cargandoHistorial =true;

    try{
      await this.chatService.InicializarChat(this.usuario.uid)
      console.log('Ingreso a inicializar chat')
    }catch(error){
      console.error('Error al inicializar')
      throw error;
    }finally{
      this.cargandoHistorial = false
    }

  }

  private configurarSuscripciones(): void{
    const subMensaje = this.chatService.mensajes$.subscribe( mensajes =>{
      this.mensajes = mensajes,
      this.debeHacerScroll = true;
    })
    const subMensajesAsis = this.chatService.asistenteRespondiendo$.subscribe( respondiendo =>{

      this.asistenteEscribiendo = respondiendo;
      if(respondiendo){
        this.debeHacerScroll= true
      }
    });
    this.suscripciones.push(subMensaje, subMensajesAsis)
  }


  private debeHacerScroll: boolean= false;

  private scrollHaciaAbajo():void{
    try{
      const container=this.messagesContainer?.nativeElement
      if(container){
        container.scrollTop = container.scrollHeight
      }
    }catch(error){
      console.error('❌ Error al hacer Scroll')

    }
  }

  ngAfterViewChecked():void{
    if(this.debeHacerScroll){
      this.scrollHaciaAbajo();
      this.debeHacerScroll=false
    }
  }

  manejoErrorImagen(evento: any): void{
    evento.target.src="https://www.genbeta.com/a-fondo/asi-puedes-probar-esperas-espana-imagen-3-google-su-mejor-generador-imagenes-ia"

  }
  async cerrarSesion(): Promise<void>{
    try{
      this.chatService.limpiarChat();

      await this.authService.cerrarSesion();
      await this.router.navigate(['/auth']);

    }catch(error){
      console.error('Error al cerrar sesion desde el componente')
      this.mensajeError = "Error al cerrar sesion"
      throw error;
    }
  }

  trackByMensaje(index: number, mensaje :MensajeChat){

  }
  formatearMensajeAsistente(contenido:string){
    return contenido
      .replace(/\n/g,'<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }

  formatearHora(fecha: Date): string{
    return fecha.toLocaleDateString('es-ES',{
        hour: '2-digit',
        minute:'2-digit'
    });

  }

  async enviarMensaje(): Promise<void>{
    if(!this.mensajeTexto.trim()){
      return;
    }
    this.mensajeError="";
    this.enviandoMensaje= true;

    //es guarando el mensaje a la variable texto
    const texto = this.mensajeTexto.trim();
    //limpiar el input
    this.mensajeTexto="";

    try{
      await this.chatService.enviarMensaje(texto);
      this.enfocarInput();
    }catch(error: any){
      console.error('Error al enviar el mensaje')
      this.mensajeError = error.message || 'Error al enviar el mensaje'
      this.mensajeTexto = texto;
    }finally{
      this.enviandoMensaje = false;
    }
  }

  async ngOnInit(): Promise <void>{
    try{
      await this.verificarAutenticacion();
      await this.inicializarChat();
      this.configurarSuscripciones();

    }catch(error){
      console.error('Error al inicializar el chat OnInit')
      this.mensajeError= "Error al cargar el chat. Intente recargar la pagina"
      throw error;
    }
  }
  ngOnDestroy():void{
    this.suscripciones.forEach(sub => sub.unsubscribe());
  }
  private enfocarInput():void{
    setTimeout(()=>{
      this.mensajeInput.nativeElement.focus();
    }, 100);
  }
  manejarTeclaPresionada(evento: KeyboardEvent){
    if(evento.key === "Enter" && !evento.shiftKey){
      evento.preventDefault();
      this.enviarMensaje
    }
  }


}

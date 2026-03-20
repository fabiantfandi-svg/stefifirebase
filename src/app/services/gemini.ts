import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { enviroment } from '../../environments/envioronment';

interface  PeticionGemini{
  contents : contentGemini[]
  generationConfig?:{
    maxOutputTokens?: number
    temperature?: number

  }
  safetySettings: SafetySetting[];
}

interface contentGemini{
  role : 'user' | 'model';
  parts : PartGemini[];

}

interface PartGemini{
  text: string
}
interface SafetySetting{
  category: string;
  threshold: string;
}

interface RespuestaGemini{
  candidates:{
    content:{
      parts:{
        text: string
      }[];
    };
    finishReason: string
  }[];
  usageMetaData?:{
    promptTokenCount: number;
    candidatesTokenCount : number;
    totalTokenCount: number
  };
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
    //inyeccciones de dependencias
  private http = inject(HttpClient)
   //variables que llevan la url
  private apiUrl = enviroment.gemini.apiUrl
  private apiKey = enviroment.gemini.apiKey

  enviarMensaje(mensaje: string, historialPrevio: contentGemini[]=[]):Observable<string>{
    //verificar si la url esta bien configurada
    if(!this.apiKey || this.apiKey ==='Tu_api_key_de_gemini'){
      console.error('Error la api key no esta configurada')
      return  throwError (()=> new Error('Api de gemini no configurada correctamente'))
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    })

    //vamos a enviar un mensaje al contenido del sistema
    const mensajeDelSistema: contentGemini={
      role: 'user',
      parts:[{
        text: "Eres un asistente virtual util y amigable, responde siempre en español de manera concisa. Eres especialista en preguntas generales y sobretodo en programacion de software. Manten un tono profesional pero cercano"
      }]
    }

    const respuestaSistema: contentGemini={
      role: 'model',
      parts:[{
        text: 'Soy tu asistente virtual especializado en programacion de software, te contestare en español ¿En que puedo ayudarte?'
      }]
    }
    const contenido: contentGemini[] = [
      mensajeDelSistema,
      respuestaSistema,
      // traer historial previo
      ...historialPrevio,
      {
        role:'user',
      parts: [{text: mensaje}]
      }
    ];

    const configuracionesSeguridad: SafetySetting[]=[
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold:"BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold:"BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold:"BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold:"BLOCK_MEDIUM_AND_ABOVE"
      },
    ];

    const cuerpoPeticion: PeticionGemini={
      contents: contenido,
      generationConfig:{
        maxOutputTokens:800,
        temperature:0.7
      },
      safetySettings: configuracionesSeguridad
    };

    //vamos a generar la url completa
    const urlCompleta = `${this.apiUrl}?key=${this.apiKey}`

    //hacer la peticion a http de conectarnos a la api de gemini
    return this.http.post<RespuestaGemini>(urlCompleta, cuerpoPeticion, {headers})
    .pipe(
      map( respuesta =>{
        //vamos a revisar que la respuesta tenga un formato correcta
        if(respuesta.candidates && respuesta.candidates.length > 0){
          const candidate = respuesta.candidates[0];
          if(candidate.content && candidate.content.parts && candidate.content.parts.length>0){
            let contenidoRespuesta = candidate.content.parts[0].text;

            //validacion por si la respuesta es erronea por el limite de tokens
            if(candidate.finishReason === "MAX_TOKENS"){
              contenidoRespuesta += "\n\n[nota: Respuesta truncada por limites de tokens, puedes pedirme que continue de nuevo]"
            }
            return contenidoRespuesta;
          }else{
            throw new Error('Respuesta no contiene un formato valido');
          }
        }else{
          throw new Error('Respuesta no contiene un formato esperado')
        }
      }),
      catchError(error=>{
        console.log("Error al comunicarse con gemini")
        let mensajeError = "Error al conectarse con gemini"

        if(error.status === 400){
          mensajeError= "Error peticion invalida a gemini, verifique la  configuracion"
        }else if(error.status === 403){
          mensajeError= "Error clave de api no valida o sin permisos"
        }else if(error.status === 429){
          mensajeError= "Has exedido el limite de peticiones a gemini, intente mas tarde"
        }else if(error.status === 500){
          mensajeError= "Error con el servidor de gemini"
        }
        return throwError(()=> new Error(mensajeError));
      })
    )
  }

  //funcion para convertir al formato de gemini
  convertirHistorialGemini(mensaje: any[]): contentGemini[]{
    const historialConvertido : contentGemini[]= mensaje.map(msg =>(
      {
        role: (msg.tipo === 'usuario' ? 'user' : 'model') as 'user' | 'model',
        parts: [{text: msg.contenido}]
      }
    ));

    if (historialConvertido.length>8){
      const ultimosMensajes = historialConvertido.slice(-8)

      if(ultimosMensajes.length>0 && ultimosMensajes[0].role==='model'){
        return ultimosMensajes.slice(1);
      }
      return ultimosMensajes;
    }
    return historialConvertido;
  }

  verificarConfiguracion(): boolean{
    const configuracionValida = !!(this.apiKey && this.apiKey !== "Tu_api_key_de_gemini" && this.apiUrl);
    return configuracionValida;
  }
}

import { Injectable, inject } from '@angular/core';
import { Auth, user, User} from '@angular/fire/auth';
import { map } from 'rxjs';
import { Usuario } from '../../models/usuario';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private auth = inject(Auth)

  //variable de tipo observable 
  usuario$ = user(this.auth)

  //variable que devuelve true o false si el usuario esta autenticado
  estadoAutenticado$ = this.usuario$.pipe(
    map(usuario => !!usuario)
  )

  //funcion asincrona que permite el inicio de sesion
  async iniciarSesion(): Promise<Usuario | null>{
    try{

      const proveedor = new GoogleAuthProvider();

      //contoladores

      proveedor.addScope('email');
      proveedor.addScope('profile');

      const resultado = await signInWithPopup(this.auth, proveedor)
      const usuarioFirebase = resultado.user

      if(usuarioFirebase){
        const usuario : Usuario ={
          uid: usuarioFirebase.uid,
          nombre: usuarioFirebase.displayName || 'Usuario sin nombre',
          email: usuarioFirebase.email || '',
          foto: usuarioFirebase.photoURL || undefined,
          fechaCreacion: new Date,
          ultimaConexion: new Date
        } 
        return usuario
      }
      return null;
    }catch(error){
      console.error('✖️Error en la autentificacion')
      throw error
    }
  }

  obtenerUsuario(): User | null{
    return this.auth.currentUser
  }

  //Cerrar Sesion

}

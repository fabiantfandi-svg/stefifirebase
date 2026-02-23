export interface Usuario {
    uid: string,
    nombre?: string,
    email: string,
    foto?: string,
    fechaCreacion: Date,
    ultimaConexion: Date
}
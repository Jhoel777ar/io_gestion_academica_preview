import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from '@angular/fire/firestore';

export interface Materia {
  id?: string;
  codigo: string;
  nombre: string;
  creditos: number;
  docente: string;
  periodo: string;
  color?: string;
  usuarioId?: string;
  fechaCreacion?: Date;
  activa?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MateriasService {
  private materiasCollection = collection(this.firestore, 'materias');

  constructor(private firestore: Firestore) {}

  async getMaterias(): Promise<Materia[]> {
    const snapshot = await getDocs(this.materiasCollection);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Materia),
    }));
  }

  async getMateriasByUsuario(uid: string): Promise<Materia[]> {
    const q = query(
      collection(this.firestore, 'materias'),
      where('usuarioId', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Materia) }));
  }

  async addMateria(materia: Materia): Promise<void> {
    await addDoc(this.materiasCollection, materia);
  }

  async updateMateria(id: string, materia: Partial<Materia>): Promise<void> {
    const materiaDoc = doc(this.firestore, `materias/${id}`);
    await updateDoc(materiaDoc, materia);
  }

  async deleteMateria(id: string): Promise<void> {
    const materiaDoc = doc(this.firestore, `materias/${id}`);
    await deleteDoc(materiaDoc);
  }
}

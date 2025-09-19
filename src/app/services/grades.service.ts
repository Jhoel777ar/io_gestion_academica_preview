import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';

export interface Grade {
  id?: string;
  materiaId: string;
  estudianteId: string;
  nota: number;
  creadoPor?: string;
  fecha?: Date;
}

@Injectable({ providedIn: 'root' })
export class GradesService {
  private gradesCollectionName = 'calificaciones';
  constructor(private firestore: Firestore) {}

  async addGrade(grade: Grade): Promise<void> {
    await addDoc(collection(this.firestore, this.gradesCollectionName), {
      ...grade,
      fecha: new Date(),
    });
  }

  async getGradesByMateria(materiaId: string): Promise<Grade[]> {
    const q = query(collection(this.firestore, this.gradesCollectionName), where('materiaId', '==', materiaId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() as Grade }));
  }

  async getGradesByStudent(estudianteId: string): Promise<Grade[]> {
    const q = query(collection(this.firestore, this.gradesCollectionName), where('estudianteId', '==', estudianteId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() as Grade }));
  }

  async updateGrade(id: string, data: Partial<Grade>): Promise<void> {
    const ref = doc(this.firestore, `${this.gradesCollectionName}/${id}`);
    await updateDoc(ref, data);
  }

  async deleteGrade(id: string): Promise<void> {
    const ref = doc(this.firestore, `${this.gradesCollectionName}/${id}`);
    await deleteDoc(ref);
  }
}

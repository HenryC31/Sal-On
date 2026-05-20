import Dexie from 'dexie';

export const db = new Dexie('SalonesReplicaDB');

db.version(2).stores({
  salones: 'id, nombre, ciudad, precio_evento, capacidad_max, anfitrion_id', 
  mis_reservas: 'id, salon_nombre, fecha_evento, monto_total, estado'
});
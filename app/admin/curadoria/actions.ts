'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function handleAprovar(id: number) {
  try {
    await prisma.autoCarrossel.update({
      where: { id },
      data: { status: 'aprovado' }
    });
    
    revalidatePath('/admin/curadoria');
    return { success: true };
  } catch (error) {
    console.error('Erro ao aprovar carrossel:', error);
    return { success: false, error: 'Falha ao aprovar' };
  }
}

export async function handleDescartar(id: number) {
  try {
    // Vamos apenas marcar como descartado para manter histórico
    await prisma.autoCarrossel.update({
      where: { id },
      data: { status: 'descartado' }
    });
    
    revalidatePath('/admin/curadoria');
    return { success: true };
  } catch (error) {
    console.error('Erro ao descartar carrossel:', error);
    return { success: false, error: 'Falha ao descartar' };
  }
}

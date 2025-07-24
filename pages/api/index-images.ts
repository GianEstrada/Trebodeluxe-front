import type { NextApiRequest, NextApiResponse } from 'next';

type IndexImageData = {
  id_imagen: number;
  nombre: string;
  descripcion?: string;
  url: string;
  public_id: string;
  seccion: 'principal' | 'banner';
  estado: 'activo' | 'inactivo' | 'izquierda' | 'derecha';
  fecha_creacion: string;
  fecha_actualizacion: string;
};

type ApiResponse = {
  success: boolean;
  images?: IndexImageData[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { seccion, estado } = req.query;
    
    let queryParams = '';
    if (seccion) {
      queryParams += `?seccion=${seccion}`;
    }
    
    const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/site-settings/index-images${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      let filteredImages = data.images;
      
      // Filtrar por estado si se especifica
      if (estado) {
        filteredImages = data.images.filter((img: IndexImageData) => img.estado === estado);
      }
      
      res.status(200).json({
        success: true,
        images: filteredImages
      });
    } else {
      res.status(500).json({
        success: false,
        error: data.message || 'Error al obtener imágenes'
      });
    }
  } catch (error) {
    console.error('Error fetching index images:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

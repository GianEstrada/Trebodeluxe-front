import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Hacer petición al backend para obtener las imágenes del index
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://trebodeluxe-backend.onrender.com';
    
    console.log('Fetching from backend URL:', `${backendUrl}/api/public/index-images`);
    
    const backendResponse = await fetch(
      `${backendUrl}/api/public/index-images`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching index images:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
}
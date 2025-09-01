// src/app/api/generate-qr-art/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, qr_code_content, num_inference_steps = 20, guidance_scale = 7.5 } = body;

    if (!prompt || !qr_code_content) {
      return NextResponse.json(
        { error: 'Prompt ve QR kod içeriği gerekli' },
        { status: 400 }
      );
    }

    // Hugging Face API Configuration
    const HF_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN;
    
    if (!HF_API_TOKEN) {
      return NextResponse.json(
        { error: 'Hugging Face API token bulunamadı. Lütfen HUGGING_FACE_API_TOKEN environment variable\'ını ayarlayın.' },
        { status: 500 }
      );
    }

    // Use Hugging Face Inference API for QR Code generation
    const response = await fetch("https://api-inference.huggingface.co/models/huggingface-projects/QR-code-AI-art-generator", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          prompt: prompt,
          qr_code_content: qr_code_content,
          num_inference_steps: num_inference_steps,
          guidance_scale: guidance_scale,
          controlnet_conditioning_scale: 1.1,
          seed: Math.floor(Math.random() * 1000000)
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      
      // If model is loading, return appropriate message
      if (response.status === 503) {
        return NextResponse.json(
          { error: 'AI modeli yükleniyor, lütfen birkaç saniye bekleyip tekrar deneyin.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'AI QR art oluşturma başarısız oldu.' },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
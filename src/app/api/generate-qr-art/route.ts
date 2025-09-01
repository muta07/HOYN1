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
    const MODEL_URL = "https://api-inference.huggingface.co/models/DionTimmer/controlnet_qrcode-control_v1p_sd15";

    if (!HF_API_TOKEN) {
      return NextResponse.json(
        { error: 'Hugging Face API token bulunamadı' },
        { status: 500 }
      );
    }

    // For demo purposes, return a simulated response
    // In production, uncomment the real API call below
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return demo response
    return NextResponse.json({
      success: true,
      message: 'Demo mode - AI QR art generation simulated',
      prompt: prompt,
      qr_content: qr_code_content
    });

    /* 
    // Real Hugging Face API call (uncomment when token is available)
    const payload = {
      inputs: prompt,
      parameters: {
        qr_code_content,
        num_inference_steps,
        guidance_scale,
        controlnet_conditioning_scale: 1.1,
        seed: Math.floor(Math.random() * 1000000)
      }
    };

    const response = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      return NextResponse.json(
        { error: 'AI QR art generation failed' },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
    */

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
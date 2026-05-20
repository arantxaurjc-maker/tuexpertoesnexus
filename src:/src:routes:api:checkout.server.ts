// src/routes/api/checkout.server.ts
// Esta es la ruta que procesa los pagos con Stripe

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      expertId,
      expertPrice,
      expertName,
      clientEmail,
      clientName,
      clientPhone,
      clientCountry,
      clientProfession,
    } = body;

    // Validar datos
    if (!expertId || !expertPrice || !clientEmail || !clientName) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Guardar o actualizar usuario en Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          email: clientEmail,
          full_name: clientName,
          phone: clientPhone,
          country: clientCountry,
          profession: clientProfession,
        },
      ], { onConflict: 'email' })
      .select()
      .single();

    if (userError) {
      console.error('Error guardando usuario:', userError);
      throw new Error('Error al guardar datos del usuario');
    }

    const userId = userData.id;

    // 2. Calcular comisiones
    const expertCommission = (expertPrice * 70) / 100;
    const nexusCommission = (expertPrice * 30) / 100;

    // 3. Crear sesión en la BD (estado: pendiente)
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert([
        {
          expert_id: expertId,
          user_id: userId,
          amount: expertPrice,
          expert_commission: expertCommission,
          nexus_commission: nexusCommission,
          status: 'pending',
          payment_id: `pending_${Date.now()}`, // Temporal, se actualiza después
        },
      ])
      .select()
      .single();

    if (sessionError) {
      console.error('Error creando sesión:', sessionError);
      throw new Error('Error al crear sesión');
    }

    // 4. Crear sesión de checkout en Stripe
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: clientEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Sesión con ${expertName}`,
              description: `Consultoría 1:1 con experto verificado`,
              images: [],
            },
            unit_amount: Math.round(expertPrice * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}&nexus_session_id=${sessionData.id}`,
      cancel_url: `${appUrl}/cancel`,
      metadata: {
        nexus_session_id: sessionData.id,
        expert_id: expertId,
        user_id: userId,
        expert_name: expertName,
        client_email: clientEmail,
      },
    });

    // 5. Actualizar session con el payment_id de Stripe
    await supabase
      .from('sessions')
      .update({ payment_id: stripeSession.id })
      .eq('id', sessionData.id);

    // 6. Retornar session ID de Stripe
    return new Response(
      JSON.stringify({
        sessionId: stripeSession.id,
        nexusSessionId: sessionData.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error en checkout:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
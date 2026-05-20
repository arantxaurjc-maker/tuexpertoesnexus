// src/routes/api/webhooks/stripe.server.ts
// Webhook que recibe notificaciones de Stripe cuando se completa un pago

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendConfirmationEmail, sendExpertNotificationEmail } from '~/lib/emails';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ⚠️ IMPORTANTE: Este endpoint NO requiere autenticación
// Stripe lo llama directamente con un webhook secret

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    // Verificar que el webhook viene realmente de Stripe
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Error verificando webhook:', error);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handlePaymentSuccess(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await handlePaymentExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new Response('Error procesando webhook', { status: 500 });
  }
}

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  console.log('✅ Pago completado:', session.id);

  // 1. Obtener información de la sesión de Nexus desde metadata
  const nexusSessionId = session.metadata?.nexus_session_id;
  const expertName = session.metadata?.expert_name;
  const clientEmail = session.metadata?.client_email;

  if (!nexusSessionId) {
    throw new Error('No se encontró nexus_session_id en metadata');
  }

  // 2. Actualizar sesión en BD como "completada"
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      payment_id: session.id,
    })
    .eq('id', nexusSessionId)
    .select()
    .single();

  if (sessionError) {
    throw new Error(`Error actualizando sesión: ${sessionError.message}`);
  }

  // 3. Crear registro de pago
  await supabase.from('payments').insert([
    {
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      session_id: nexusSessionId,
      amount: (session.amount_total || 0) / 100, // Stripe usa centavos
      currency: session.currency?.toUpperCase() || 'EUR',
      status: 'succeeded',
      payment_method: session.payment_method_types?.[0] || 'card',
    },
  ]);

  // 4. Enviar email de confirmación al cliente
  await sendConfirmationEmail({
    clientEmail: clientEmail || session.customer_email || '',
    clientName: sessionData.user_id,
    expertName: expertName || '',
    amount: (session.amount_total || 0) / 100,
    sessionId: nexusSessionId,
  });

  // 5. Enviar notificación al experto
  // (necesitarías obtener el email del experto de la BD)
  const { data: expertData } = await supabase
    .from('experts')
    .select('email')
    .eq('id', sessionData.expert_id)
    .single();

  if (expertData?.email) {
    await sendExpertNotificationEmail({
      expertEmail: expertData.email,
      expertName: expertName || '',
      clientName: sessionData.user_id,
      amount: sessionData.expert_commission,
      sessionId: nexusSessionId,
    });
  }

  console.log('✅ Pago procesado exitosamente');
}

async function handlePaymentExpired(session: Stripe.Checkout.Session) {
  console.log('⏱️ Sesión de pago expirada:', session.id);

  const nexusSessionId = session.metadata?.nexus_session_id;

  if (nexusSessionId) {
    await supabase
      .from('sessions')
      .update({ status: 'expired' })
      .eq('id', nexusSessionId);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  console.log('💸 Reembolso procesado:', charge.id);

  // Actualizar estado del pago a refunded
  await supabase
    .from('payments')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', charge.payment_intent);

  // También actualizar la sesión
  const { data: paymentData } = await supabase
    .from('payments')
    .select('session_id')
    .eq('stripe_payment_intent_id', charge.payment_intent)
    .single();

  if (paymentData?.session_id) {
    await supabase
      .from('sessions')
      .update({ status: 'refunded' })
      .eq('id', paymentData.session_id);
  }
}
import { supabase } from './src/lib/supabase';
import fetch from 'node-fetch';

async function testResendSchedule() {
  const { data: session } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // Not real, just to get token shape maybe?
    password: 'test'
  }); // Actually we can't easily fake the user token here.
}
testResendSchedule();

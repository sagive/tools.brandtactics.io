import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  // Find Acme Corp
  const { data: clients, error: clientErr } = await supabase
    .from('clients')
    .select('id')
    .eq('name', 'Acme Corp')
    .limit(1);

  if (clientErr || !clients || clients.length === 0) {
    console.error("Acme Corp client not found");
    return;
  }

  const clientId = clients[0].id;

  const dummyTasks = [
    {
      title: "Design new website homepage",
      description: "Create wireframes and high-fidelity mockups for the new homepage.",
      status: "Completed",
      priority: "High",
      assignee: "mark",
      client_id: clientId,
      end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    },
    {
      title: "Integrate payment gateway",
      description: "Set up Stripe integration for the new e-commerce store.",
      status: "Working on it",
      priority: "High",
      assignee: "sarah",
      client_id: clientId,
      end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    {
      title: "Write blog post about Q3 updates",
      description: "Draft a blog post highlighting our new features.",
      status: "Pending",
      priority: "Medium",
      assignee: "mark",
      client_id: clientId,
      end_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    },
    {
      title: "Fix responsive layout bugs on mobile",
      description: "The navigation menu overlaps the content on iPhone SE.",
      status: "Stuck",
      priority: "High",
      assignee: "john",
      client_id: clientId,
      end_date: new Date(Date.now() - 86400000).toISOString(),
    }
  ];

  const { error } = await supabase.from('tasks').insert(dummyTasks);
  
  if (error) {
    console.error("Failed to insert tasks:", error);
  } else {
    console.log("Successfully restored example tasks for Acme Corp!");
  }
}

seed();

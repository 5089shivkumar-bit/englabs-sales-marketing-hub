
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bowjggxuslukxzmnbmqv.supabase.co'
const supabaseKey = 'sb_publishable_UeqVDl3kKsoMKsNhJ1UB8A_L971KZU8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsertBadDate() {
    console.log('Attempting to insert with localized date string...')

    const testCustomer = {
        name: "Bad Date Corp",
        updated_at: "21 Jan 2026 12:30:45 PM" // Simulating dateUtils output
    }

    const { data, error } = await supabase
        .from('customers')
        .insert(testCustomer)
        .select()

    if (error) {
        console.error('INSERT FAILED AS EXPECTED:', error)
    } else {
        console.log('INSERT SUCCESSFUL? This is unexpected:', data)
        await supabase.from('customers').delete().eq('id', data[0].id)
    }
}

testInsertBadDate()


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bowjggxuslukxzmnbmqv.supabase.co'
const supabaseKey = 'sb_publishable_UeqVDl3kKsoMKsNhJ1UB8A_L971KZU8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetchProjects() {
    console.log('Attempting to fetch projects with is_deleted filter...')

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('FETCH FAILED:', error)
    } else {
        console.log('FETCH SUCCESSFUL. Count:', data.length)
        if (data.length > 0) {
            console.log('first project:', data[0])
        }
    }
}

testFetchProjects()

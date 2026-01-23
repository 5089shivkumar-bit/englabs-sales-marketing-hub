import { supabase } from './supabaseClient';
import { Customer, Expo, Visit, TechCategory, PricingRecord, ContactPerson, Project } from '../types';

// --- CUSTOMERS ---

export const api = {
    customers: {
        async fetchAll(): Promise<Customer[]> {
            const { data, error } = await supabase
                .from('customers')
                .select(`
          *,
          contacts (*),
          pricing_history (*)
        `);

            if (error) throw error;

            // Map Supabase response to Customer type
            // Note: Supabase returns snake_case, but types are camelCase. 
            // Ideally we should map them.
            return data?.map((c: any) => ({
                id: c.id,
                name: c.name,
                city: c.city,
                state: c.state,
                country: c.country,
                annualTurnover: c.annual_turnover,
                projectTurnover: c.project_turnover,
                industry: c.industry,
                lastModifiedBy: c.last_modified_by,
                updatedAt: c.updated_at,
                contacts: c.contacts || [], // contacts are joined
                pricingHistory: c.pricing_history?.map((p: any) => ({
                    id: p.id,
                    customerId: p.customer_id,
                    tech: p.tech as TechCategory,
                    rate: p.rate,
                    unit: p.unit,
                    date: p.date
                })) || []
            })) || [];
        },

        async create(customer: Customer): Promise<Customer> {
            // 1. Insert Customer
            const { data: custData, error: custError } = await supabase
                .from('customers')
                .insert({
                    // We can let Supabase generate ID if we didn't provide one, but types say string. 
                    // If we provide UUID, fine. If 'c-...' string, it might fail if ID is GUID type.
                    // The schema uses UUID. The frontend uses 'c-' + timestamp.
                    // REFACTOR: We should let Supabase generate UUIDs or change schema to TEXT.
                    // For now, I'll assume we let Supabase generate UUID and we update the frontend object.
                    // BUT, if I change ID, I break relations.
                    // Let's omit ID and let Supabase generate it, then return it.
                    name: customer.name,
                    city: customer.city,
                    state: customer.state,
                    country: customer.country,
                    annual_turnover: customer.annualTurnover,
                    project_turnover: customer.projectTurnover,
                    industry: customer.industry,
                    last_modified_by: customer.lastModifiedBy,
                    updated_at: customer.updatedAt
                })
                .select()
                .single();

            if (custError) throw custError;

            // 2. Insert Contacts
            if (customer.contacts && customer.contacts.length > 0) {
                const contactsToInsert = customer.contacts.map(c => ({
                    customer_id: custData.id,
                    name: c.name,
                    designation: c.designation,
                    email: c.email,
                    phone: c.phone
                }));

                const { error: contactError } = await supabase
                    .from('contacts')
                    .insert(contactsToInsert);

                if (contactError) console.error("Error saving contacts", contactError);
            }

            // Return the complete object (or fetch it again)
            return {
                ...customer,
                id: custData.id
            };
        },

        async update(customer: Customer): Promise<void> {
            // Update basic fields
            const { error } = await supabase
                .from('customers')
                .update({
                    name: customer.name,
                    city: customer.city,
                    state: customer.state,
                    country: customer.country,
                    annual_turnover: customer.annualTurnover,
                    project_turnover: customer.projectTurnover,
                    industry: customer.industry,
                    last_modified_by: customer.lastModifiedBy,
                    updated_at: new Date().toISOString()
                })
                .eq('id', customer.id);

            if (error) throw error;

            // Update contacts is tricky (merge/delete). 
            // For simplicity, maybe delete all and re-insert? Or just upsert?
            // Let's try upsert if they have IDs, but frontend generates 'cp-...' IDs.
            // Simplest for this prototype: Delete all for this customer and re-insert.
            await supabase.from('contacts').delete().eq('customer_id', customer.id);

            if (customer.contacts && customer.contacts.length > 0) {
                const contactsToInsert = customer.contacts.map(c => ({
                    customer_id: customer.id,
                    name: c.name,
                    designation: c.designation,
                    email: c.email,
                    phone: c.phone
                }));
                await supabase.from('contacts').insert(contactsToInsert);
            }
        },

        async delete(id: string): Promise<void> {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);
            if (error) throw error;
        }
    },

    expos: {
        async fetchAll(): Promise<Expo[]> {
            const { data, error } = await supabase.from('expos').select('*');
            if (error) throw error;
            return data || [];
        },
        async create(expo: Expo): Promise<Expo> {
            const { data, error } = await supabase.from('expos').insert({
                name: expo.name,
                date: expo.date,
                location: expo.location,
                industry: expo.industry,
                region: expo.region,
                link: expo.link
            }).select().single();

            if (error) throw error;
            return { ...expo, id: data.id };
        },
        async delete(id: string): Promise<void> {
            await supabase.from('expos').delete().eq('id', id);
        }
    },

    visits: {
        async fetchAll(): Promise<Visit[]> {
            const { data, error } = await supabase.from('visits').select('*');
            if (error) throw error;

            return data?.map((v: any) => ({
                id: v.id,
                customerId: v.customer_id,
                customerName: v.customer_name,
                date: v.date,
                purpose: v.purpose,
                assignedTo: v.assigned_to,
                status: v.status,
                notes: v.notes
            })) || [];
        },
        async create(visit: Visit): Promise<Visit> {
            const { data, error } = await supabase.from('visits').insert({
                customer_id: visit.customerId,
                customer_name: visit.customerName,
                date: visit.date,
                purpose: visit.purpose,
                assigned_to: visit.assignedTo,
                status: visit.status,
                notes: visit.notes
            }).select().single();

            if (error) throw error;
            return { ...visit, id: data.id };
        },
        async update(visit: Visit): Promise<void> {
            await supabase.from('visits').update({
                customer_id: visit.customerId,
                customer_name: visit.customerName,
                date: visit.date,
                purpose: visit.purpose,
                assigned_to: visit.assignedTo,
                status: visit.status,
                notes: visit.notes
            }).eq('id', visit.id);
        },
        async delete(id: string): Promise<void> {
            await supabase.from('visits').delete().eq('id', id);
        }
    },

    projects: {
        async fetchAll(): Promise<Project[]> {
            try {
                // Try fetching with soft-delete filter
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .or('is_deleted.is.null,is_deleted.eq.false')
                    .order('updated_at', { ascending: false });

                if (error) {
                    // specific code for undefined column
                    if (error.code === '42703') {
                        console.warn('Soft delete column missing, falling back to all projects');
                        return this.fetchAllFallback();
                    }
                    throw error;
                }

                return data?.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    startDate: p.start_date,
                    endDate: p.end_date,
                    status: p.status,
                    createdBy: p.created_by,
                    companyName: p.company_name,
                    updatedAt: p.updated_at
                })) || [];
            } catch (err: any) {
                if (err.code === '42703') {
                    return this.fetchAllFallback();
                }
                throw err;
            }
        },
        async fetchAllFallback(): Promise<Project[]> {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data?.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                startDate: p.start_date,
                endDate: p.end_date,
                status: p.status,
                createdBy: p.created_by,
                companyName: p.company_name,
                updatedAt: p.updated_at
            })) || [];
        },
        async create(project: Project): Promise<Project> {
            // Check if column exists by trying to insert with it
            // Actually, safe to just try insert. If it fails, retry without is_deleted
            try {
                const { data, error } = await supabase.from('projects').insert({
                    name: project.name,
                    description: project.description,
                    start_date: project.startDate,
                    end_date: project.endDate,
                    status: project.status,
                    created_by: project.createdBy,
                    company_name: project.companyName,
                    updated_at: new Date().toISOString(),
                    is_deleted: false
                }).select().single();

                if (error) {
                    if (error.code === '42703') {
                        // Fallback create without is_deleted
                        const { data: data2, error: error2 } = await supabase.from('projects').insert({
                            name: project.name,
                            description: project.description,
                            start_date: project.startDate,
                            end_date: project.endDate,
                            status: project.status,
                            created_by: project.createdBy,
                            company_name: project.companyName,
                            updated_at: new Date().toISOString()
                        }).select().single();
                        if (error2) throw error2;
                        return { ...project, id: data2.id };
                    }
                    throw error;
                }
                return { ...project, id: data.id };
            } catch (err: any) {
                throw err;
            }
        },
        async update(project: Project): Promise<void> {
            const { error } = await supabase.from('projects').update({
                name: project.name,
                description: project.description,
                start_date: project.startDate,
                end_date: project.endDate,
                status: project.status,
                created_by: project.createdBy,
                company_name: project.companyName,
                updated_at: new Date().toISOString()
            }).eq('id', project.id);
            if (error) throw error;
        },
        async delete(id: string): Promise<void> {
            // Try soft delete
            const { error } = await supabase
                .from('projects')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error && error.code === '42703') {
                // Fallback to hard delete if column missing
                console.warn('Soft delete column missing, performing hard delete');
                const { error: hardError } = await supabase.from('projects').delete().eq('id', id);
                if (hardError) throw hardError;
            } else if (error) {
                throw error;
            }
        }
    },
    expenses: {
        async fetchByProject(projectId: string): Promise<Expense[]> {
            const { data, error } = await supabase
                .from('project_expenses')
                .select('*')
                .eq('project_id', projectId)
                .order('date', { ascending: false });

            if (error) throw error;
            return data?.map((e: any) => ({
                id: e.id,
                projectId: e.project_id,
                name: e.name,
                amount: e.amount,
                category: e.category,
                date: e.date,
                paidBy: e.paid_by,
                status: e.status,
                notes: e.notes,
                createdAt: e.created_at
            })) || [];
        },
        async create(expense: Omit<Expense, 'id'>): Promise<Expense> {
            const { data, error } = await supabase.from('project_expenses').insert({
                project_id: expense.projectId,
                name: expense.name,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                paid_by: expense.paidBy,
                status: expense.status,
                notes: expense.notes
            }).select().single();

            if (error) throw error;
            return { ...expense, id: data.id };
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase.from('project_expenses').delete().eq('id', id);
            if (error) throw error;
        }
    },
    income: {
        async fetchByProject(projectId: string): Promise<Income[]> {
            const { data, error } = await supabase
                .from('project_incomes')
                .select('*')
                .eq('project_id', projectId)
                .order('received_date', { ascending: false });

            if (error) throw error;
            return data?.map((i: any) => ({
                id: i.id,
                projectId: i.project_id,
                clientName: i.client_name,
                amount: i.amount,
                invoiceNumber: i.invoice_number,
                receivedDate: i.received_date,
                status: i.status,
                createdAt: i.created_at
            })) || [];
        },
        async create(income: Omit<Income, 'id'>): Promise<Income> {
            const { data, error } = await supabase.from('project_incomes').insert({
                project_id: income.projectId,
                client_name: income.clientName,
                amount: income.amount,
                invoice_number: income.invoiceNumber,
                received_date: income.receivedDate,
                status: income.status
            }).select().single();

            if (error) throw error;
            return { ...income, id: data.id };
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase.from('project_incomes').delete().eq('id', id);
            if (error) throw error;
        }
    }
};

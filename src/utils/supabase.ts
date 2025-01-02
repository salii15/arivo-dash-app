import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type Database = {
  public: {
    tables: {
      user_info: {
        Row: {
          uuid: string
          display_name: string
          email: string
          phone: string
          position: string
          company: string
          pp_url: string
          default_pp: boolean
          language: 'English' | 'Turkish' | 'Spanish'
          date: 'US' | 'Europe'
          currency: 'USD' | 'Euro' | 'TRY'
          legal_name: string
          address: string
          tax_number: string
          country: string
        }
      }
      products: {
        Row: {
          title: string
          category: string
          url: string
          image_url: string
          note: string
          SKU: string
          gl_id: string
          ref_images: string[]
          model3d_id: string
        }
      }
      projects: {
        Row: {
          title: string
          status: 'On Going' | 'Completed' | 'Canceled'
          budget: number
          deadline: string
          note: string
          product_ids: string[]
        }
      }
      orders: {
        Row: {
          title: string
          order_number: string
          status: 'On Review' | 'Approved' | 'Completed' | 'Canceled'
          budget: number
          due_date: string
          paid: boolean
          invoice_number: string
          notes: string
          projects: string[]
        }
      }
      model3d: {
        Row: {
          product_id: string
          model3d_url: string
          poster_url: string
        }
      }
      category_list: {
        Row: {
          user_id: string
          title: string
        }
      }
    }
  }
}

export const supabase = createClientComponentClient<Database>()

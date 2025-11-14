import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_ref, mobile, email, name } = body;

    // Build WHERE clause dynamically based on provided fields
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (customer_ref && customer_ref.trim()) {
      conditions.push(`customer_ref = $${paramIndex}`);
      values.push(customer_ref.trim());
      paramIndex++;
    }

    if (mobile && mobile.trim()) {
      conditions.push(`mobile = $${paramIndex}`);
      values.push(mobile.trim());
      paramIndex++;
    }

    if (email && email.trim()) {
      conditions.push(`email = $${paramIndex}`);
      values.push(email.trim());
      paramIndex++;
    }

    if (name && name.trim()) {
      conditions.push(`(firstname_th ILIKE $${paramIndex} OR lastname_th ILIKE $${paramIndex} OR firstname_en ILIKE $${paramIndex} OR lastname_en ILIKE $${paramIndex})`);
      values.push(`%${name.trim()}%`);
      paramIndex++;
    }

    if (conditions.length === 0) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลอย่างน้อย 1 ช่อง' },
        { status: 400 }
      );
    }

    const whereClause = conditions.join(' AND ');

    // Query member data from primo_memberships
    const memberQuery = `
      SELECT 
        customer_ref,
        mobile,
        email,
        firstname_th,
        lastname_th,
        firstname_en,
        lastname_en,
        member_status,
        account_status,
        last_active_at
      FROM primo_memberships
      WHERE ${whereClause}
      LIMIT 1
    `;

    const memberResult = await pool.query(memberQuery, values);

    if (memberResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสมาชิก' },
        { status: 404 }
      );
    }

    const member = memberResult.rows[0];

    // Query related data
    const customerRef = member.customer_ref;
    const memberMobile = member.mobile;

    // Check if member exists in migrate_food_story_members
    let migratedMember = null;
    if (memberMobile) {
      try {
        // Remove leading 0 if exists and convert to integer for phone_no
        const phoneNo = parseInt(memberMobile.replace(/^0/, ''));
        const migratedQuery = `
          SELECT 
            phone_no,
            firstname_th,
            lastname_th,
            firstname_en,
            lastname_en,
            current_point,
            tier_id,
            tier_name
          FROM migrate_food_story_members
          WHERE phone_no = $1
          LIMIT 1
        `;
        const migratedResult = await pool.query(migratedQuery, [phoneNo]);
        if (migratedResult.rows.length > 0) {
          migratedMember = migratedResult.rows[0];
        }
      } catch (error) {
        console.error('Error querying migrate_food_story_members:', error);
      }
    }

    // Get bill details
    // Try to match by customer_ref (convert to text) or by member IDs
    const billsQuery = `
      SELECT 
        payment_date,
        payment_time,
        payment_id,
        receipt_no,
        tax_inv_no,
        void,
        price_before_discount,
        item_discount,
        include_revenue,
        fs_crm_member_id,
        cus_crm_member_id,
        customer_phone_number,
        customer_name,
        bill_discounted_price,
        sub_amount,
        sub_before_tax,
        tax,
        rounding_amount,
        voucher_discount,
        net_paid,
        branch_code,
        store_name,
        payment_type,
        order_type
      FROM food_story_bill_detail
      WHERE cus_crm_member_id::text = $1 
         OR fs_crm_member_id = $2
         OR customer_phone_number = $3
      ORDER BY payment_date DESC, payment_time DESC
      LIMIT 100
    `;

    // Get coupons
    // Try multiple ways to match customer - customer_ref can be text or need casting
    const couponsQuery = `
      SELECT 
        coupon_code,
        coupon_type,
        coupon_status,
        expired_at,
        redeemed_at,
        used_at,
        campaign,
        brand
      FROM primo_coupons
      WHERE customer_ref::text = $1::text
         OR customer_ref = $1
      ORDER BY COALESCE(expired_at, redeemed_at, used_at) DESC NULLS LAST
      LIMIT 100
    `;

    // Get points
    const pointsQuery = `
      SELECT 
        point_balance,
        point_currency,
        expired_date,
        point_type
      FROM primo_point_on_hand
      WHERE customer_ref = $1
      ORDER BY updated_at DESC
      LIMIT 100
    `;

    // Get tier movements
    const tierMovementsQuery = `
      SELECT 
        log_id,
        customer_ref,
        loyalty_program_id,
        loyalty_program_name,
        tier_group_id,
        tier_group_name,
        tier_id,
        tier_name,
        entry_date,
        expired_date,
        retention_next_expire_date,
        promotion_next_entry_date,
        promotion_next_expire_date,
        previous_tier_id,
        previous_tier_name,
        promotion_next_tier_id,
        promotion_next_tier_name,
        grace_period_start_date,
        grace_period_end_date,
        created_at,
        updated_at,
        owner
      FROM primo_member_tier_movement
      WHERE customer_ref::text = $1::text
         OR customer_ref = $1
      ORDER BY entry_date DESC, created_at DESC
      LIMIT 100
    `;

    const [billsResult, couponsResult, pointsResult, tierMovementsResult] = await Promise.all([
      pool.query(billsQuery, [customerRef, parseInt(customerRef) || 0, member.mobile || '']).catch((err) => {
        console.error('Bills query error:', err);
        return { rows: [] };
      }),
      pool.query(couponsQuery, [customerRef]).catch((err) => {
        console.error('Coupons query error:', err);
        console.error('Customer ref used:', customerRef);
        // Try alternative queries if first fails
        return pool.query(`
          SELECT 
            coupon_code,
            coupon_type,
            coupon_status,
            expired_at,
            redeemed_at,
            used_at,
            campaign,
            brand
          FROM primo_coupons
          WHERE customer_ref = $1
          ORDER BY COALESCE(expired_at, redeemed_at, used_at) DESC NULLS LAST
          LIMIT 100
        `, [customerRef]).catch((err2) => {
          console.error('Alternative coupons query error:', err2);
          // Try one more time with text comparison
          return pool.query(`
            SELECT 
              coupon_code,
              coupon_type,
              coupon_status,
              expired_at,
              redeemed_at,
              used_at,
              campaign,
              brand
            FROM primo_coupons
            WHERE customer_ref::text ILIKE $1
            ORDER BY COALESCE(expired_at, redeemed_at, used_at) DESC NULLS LAST
            LIMIT 100
          `, [`%${customerRef}%`]).catch(() => {
            console.error('All coupon queries failed');
            return { rows: [] };
          });
        });
      }),
      pool.query(pointsQuery, [customerRef]).catch((err) => {
        console.error('Points query error:', err);
        return { rows: [] };
      }),
      pool.query(tierMovementsQuery, [customerRef]).catch((err) => {
        console.error('Tier movements query error:', err);
        // Try alternative query
        return pool.query(`
          SELECT 
            log_id,
            customer_ref,
            loyalty_program_id,
            loyalty_program_name,
            tier_group_id,
            tier_group_name,
            tier_id,
            tier_name,
            entry_date,
            expired_date,
            retention_next_expire_date,
            promotion_next_entry_date,
            promotion_next_expire_date,
            previous_tier_id,
            previous_tier_name,
            promotion_next_tier_id,
            promotion_next_tier_name,
            grace_period_start_date,
            grace_period_end_date,
            created_at,
            updated_at,
            owner
          FROM primo_member_tier_movement
          WHERE customer_ref = $1
          ORDER BY entry_date DESC, created_at DESC
          LIMIT 100
        `, [customerRef]).catch(() => ({ rows: [] }));
      }),
    ]);

    // Get promotions for each bill
    const bills = billsResult.rows;
    const billsWithPromotions = await Promise.all(
      bills.map(async (bill: { payment_id?: number; receipt_no?: string;[key: string]: unknown }) => {
        if (!bill.payment_id && !bill.receipt_no) {
          return { ...bill, promotions: [] };
        }

        const promotionConditions: string[] = [];
        const promotionValues: (string | number)[] = [];
        let paramIndex = 1;

        if (bill.payment_id) {
          promotionConditions.push(`payment_id = $${paramIndex}`);
          promotionValues.push(bill.payment_id);
          paramIndex++;
        }

        if (bill.receipt_no) {
          promotionConditions.push(`receipt_no = $${paramIndex}`);
          promotionValues.push(bill.receipt_no);
          paramIndex++;
        }

        if (promotionConditions.length === 0) {
          return { ...bill, promotions: [] };
        }

        const promotionWhereClause = promotionConditions.join(' OR ');

        const promotionsQuery = `
          SELECT 
            payment_date,
            payment_time,
            payment_id,
            invoice_item_id,
            receipt_no,
            tax_inv_no,
            void,
            promotion_id,
            promotion_type,
            final_pro_ref_code,
            promotion_name,
            bill_discounted_price,
            before_vat,
            vat_amount,
            branch_code,
            store_name,
            payment_type,
            order_type
          FROM food_story_promotion
          WHERE ${promotionWhereClause}
          ORDER BY payment_date DESC, payment_time DESC
        `;

        try {
          const promotionsResult = await pool.query(promotionsQuery, promotionValues);
          return { ...bill, promotions: promotionsResult.rows };
        } catch (error) {
          console.error('Error fetching promotions:', error);
          return { ...bill, promotions: [] };
        }
      })
    );

    // Return member data with migrated info
    const memberWithMigrated = {
      customer_ref: member.customer_ref,
      mobile: member.mobile,
      email: member.email,
      firstname_th: member.firstname_th,
      lastname_th: member.lastname_th,
      firstname_en: member.firstname_en,
      lastname_en: member.lastname_en,
      member_status: member.member_status,
      account_status: member.account_status,
      last_active_at: member.last_active_at,
      isMigrated: !!migratedMember,
      migratedData: migratedMember || undefined,
    };

    // If no tier movements but has migrated member, create tier movement from migrated data
    const finalTierMovements = tierMovementsResult.rows.length > 0 
      ? tierMovementsResult.rows 
      : (migratedMember ? [{
          tier_id: migratedMember.tier_id,
          tier_name: migratedMember.tier_name,
          entry_date: null,
          expired_date: null,
          loyalty_program_name: 'Food Story (Migrated)',
          tier_group_name: 'Migrated',
        }] : []);

    return NextResponse.json({
      member: memberWithMigrated,
      bills: billsWithPromotions,
      coupons: couponsResult.rows,
      points: pointsResult.rows,
      tierMovements: finalTierMovements,
    });

    // Log for debugging
    console.log('Coupons found:', couponsResult.rows.length);
    if (couponsResult.rows.length > 0) {
      console.log('Sample coupon:', couponsResult.rows[0]);
    }
  } catch (error) {
    console.error('Database query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล: ' + errorMessage },
      { status: 500 }
    );
  }
}


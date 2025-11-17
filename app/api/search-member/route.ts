import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_ref, mobile, email, name } = body;
    const inputMobile = mobile?.trim() || null;

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
      const trimmedName = name.trim();
      const likeValue = `%${trimmedName}%`;
      const noSpaceValue = `%${trimmedName.replace(/\s+/g, "")}%`;
      conditions.push(`(
        firstname_th ILIKE $${paramIndex} OR
        lastname_th ILIKE $${paramIndex + 1} OR
        firstname_en ILIKE $${paramIndex + 2} OR
        lastname_en ILIKE $${paramIndex + 3} OR
        CONCAT(firstname_th, ' ', lastname_th) ILIKE $${paramIndex + 4} OR
        CONCAT(firstname_en, ' ', lastname_en) ILIKE $${paramIndex + 5} OR
        CONCAT(firstname_th, lastname_th) ILIKE $${paramIndex + 6} OR
        CONCAT(firstname_en, lastname_en) ILIKE $${paramIndex + 7}
      )`);
      values.push(
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        noSpaceValue,
        noSpaceValue
      );
      paramIndex += 8;
    }

    if (conditions.length === 0) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลอย่างน้อย 1 ช่อง' },
        { status: 400 }
      );
    }

    const whereClause = conditions.join(' AND ');

    // Query member data from primo_memberships
    const hasExactFilter = Boolean(
      (customer_ref && customer_ref.trim()) ||
        (mobile && mobile.trim()) ||
        (email && email.trim()),
    );
    const memberQueryLimit = hasExactFilter ? 1 : 20;

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
      LIMIT ${memberQueryLimit}
    `;

    const memberResult = await pool.query(memberQuery, values);
    const members = memberResult.rows;

    const fetchMigratedSources = async (phoneValue?: string | null) => {
      const sources: Array<{ source: 'food_story' | 'rocket'; data: any }> = [];
      if (!phoneValue) return sources;
      const normalized = phoneValue.replace(/\D/g, '');
      if (!normalized) return sources;
      const phoneNo = parseInt(normalized, 10);
      if (Number.isNaN(phoneNo)) return sources;

      try {
        const migratedQuery = `
          SELECT 
            phone_no,
            firstname_th,
            lastname_th,
            firstname_en,
            lastname_en,
            current_point,
            tier_id,
            tier_name,
            birth_date,
            tier_entry_date,
            created_date,
            updated_date
          FROM migrate_food_story_members
          WHERE phone_no = $1
          LIMIT 1
        `;
        const migratedResult = await pool.query(migratedQuery, [phoneNo]);
        if (migratedResult.rows.length > 0) {
          sources.push({ source: 'food_story', data: migratedResult.rows[0] });
        }
      } catch (error) {
        console.error('Error querying migrate_food_story_members:', error);
      }

      try {
        const rocketQuery = `
          SELECT 
            phone_no,
            fullname,
            tier_name,
            current_point,
            birthdate,
            register_date,
            last_login_date,
            last_activity_date
          FROM migrate_rocket_members
          WHERE phone_no = $1
          LIMIT 1
        `;
        const rocketResult = await pool.query(rocketQuery, [phoneNo]);
        if (rocketResult.rows.length > 0) {
          sources.push({ source: 'rocket', data: rocketResult.rows[0] });
        }
      } catch (error) {
        console.error('Error querying migrate_rocket_members:', error);
      }

      return sources;
    };

    if (members.length === 0) {
      const migrateFallbackSources = await fetchMigratedSources(inputMobile);
      if (migrateFallbackSources.length === 0) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลสมาชิก' },
          { status: 404 }
        );
      }

      const fallbackTierMovements = migrateFallbackSources
        .filter((source) => source.data?.tier_name)
        .map((source) => ({
          tier_id:
            source.source === 'food_story'
              ? source.data.tier_id ?? null
              : null,
          tier_name: source.data.tier_name,
          entry_date: null,
          expired_date: null,
          loyalty_program_name:
            source.source === 'food_story'
              ? 'Food Story (Migrated)'
              : 'Rocket (Migrated)',
          tier_group_name: 'Migrated',
        }));

      const foodSource = migrateFallbackSources.find(
        (s) => s.source === 'food_story',
      );
      const rocketSource = migrateFallbackSources.find(
        (s) => s.source === 'rocket',
      );
      const rocketFullname = rocketSource?.data.fullname?.trim() || '';
      const [rocketFirstName, ...rocketLastParts] = rocketFullname.split(' ');
      const rocketLastName =
        rocketLastParts.length > 0 ? rocketLastParts.join(' ') : null;

      const fallbackMember = {
        customer_ref: null,
        mobile: inputMobile,
        email: null,
        firstname_th:
          foodSource?.data.firstname_th || rocketFirstName || null,
        lastname_th: foodSource?.data.lastname_th || rocketLastName || null,
        firstname_en: foodSource?.data.firstname_en || null,
        lastname_en: foodSource?.data.lastname_en || null,
        member_status: null,
        account_status: null,
        last_active_at: null,
        migratedSources: migrateFallbackSources,
        isMigratedOnly: true,
      };

      return NextResponse.json({
        member: fallbackMember,
        members: [fallbackMember],
        bills: [],
        coupons: [],
        points: [],
        tierMovements: fallbackTierMovements,
      });
    }

    const member = members[0];

    // Query related data
    const customerRef = member.customer_ref;
    const memberMobile = member.mobile;

    const migratedSources = await fetchMigratedSources(memberMobile);

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
      migratedSources,
      isMigratedOnly: false,
    };

    // If no tier movements but has migrated member, create tier movement from migrated data
    let finalTierMovements = tierMovementsResult.rows;
    if (finalTierMovements.length === 0 && migratedSources.length > 0) {
      finalTierMovements = migratedSources
        .filter((source) => source.data.tier_name)
        .map((source) => ({
          tier_id:
            source.source === 'food_story'
              ? source.data.tier_id ?? null
              : null,
          tier_name: source.data.tier_name,
          entry_date: null,
          expired_date: null,
          loyalty_program_name:
            source.source === 'food_story'
              ? 'Food Story (Migrated)'
              : 'Rocket (Migrated)',
          tier_group_name: 'Migrated',
        }));
    }

    const membersWithMigrated = members.map((m) =>
      m.customer_ref === member.customer_ref ? memberWithMigrated : m,
    );

    const responsePayload = {
      member: memberWithMigrated,
      members: membersWithMigrated,
      bills: billsWithPromotions,
      coupons: couponsResult.rows,
      points: pointsResult.rows,
      tierMovements: finalTierMovements,
    };

    // Log for debugging
    console.log('Coupons found:', couponsResult.rows.length);
    if (couponsResult.rows.length > 0) {
      console.log('Sample coupon:', couponsResult.rows[0]);
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Database query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล: ' + errorMessage },
      { status: 500 }
    );
  }
}


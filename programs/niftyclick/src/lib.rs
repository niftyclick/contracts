use anchor_lang::prelude::*;

declare_id!("2eaxeLhmPps1oknT5M9n2gzmzfvowz49u23pFJy9Nkez");

#[program]
pub mod niftyclick {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        ctx.accounts.link_account.bump = bump;
        Ok(())
    }

    pub fn add_link(ctx: Context<AddLink>, content_link : String) -> Result<()> {
        ctx.accounts.link_account.links.push(content_link);
        Ok(())
    }

}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init, 
        space = 9000,
        seeds = [
            b"link_init".as_ref(),
            user.key().as_ref(),
        ],
        bump,
        payer = user)]
    link_account: Account<'info, LinkState>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddLink<'info> {
    #[account(mut)]
    link_account: Account<'info, LinkState>,
}

#[account]
pub struct LinkState {
    pub bump: u8,
    pub links : Vec<String>,
    pub authority: Pubkey
}
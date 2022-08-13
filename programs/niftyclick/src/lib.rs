use anchor_lang::prelude::*;

declare_id!("AkB78wYxMJjweth3zCeDXGqNzRSYyJa96dg2MKXt4QT9");


#[program]
pub mod niftyclick {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.link_account.bump = *ctx.bumps.get("link_account").unwrap();
        ctx.accounts.link_account.authority = ctx.accounts.user.key();
        Ok(())
    }

    pub fn add_link(ctx: Context<AddLink>, content_link : String) -> Result<()> {
        require_keys_eq!(ctx.accounts.link_account.authority, ctx.accounts.user.key(), Unauthorized::AddLink);
        require_gte!(200, content_link.as_bytes().len() , LinkError::AddLink);
        ctx.accounts.link_account.links.push(content_link);
        Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, 
        space = 9000,
        seeds = [
            b"link_account",
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
    user: Signer<'info>,
}

#[account]
pub struct LinkState {
    pub bump: u8,
    pub links : Vec<String>,
    pub authority: Pubkey
}

#[error_code]
pub enum LinkError {
    #[msg("Input link length is too long.")]
    AddLink,
}

#[error_code]
pub enum Unauthorized {
    #[msg("Not the owner of the PDA Account.")]
    AddLink,
}
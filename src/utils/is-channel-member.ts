export const isChannelMember = (status: string) => {
    return ["creator", "administrator", "member", "restricted", "kicked"].includes(status);
};

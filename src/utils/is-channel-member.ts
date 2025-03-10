export const isChannelMember = (status: string) => {
    return ["creator", "administrator", "member"].includes(status);
};

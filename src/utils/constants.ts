/** @internal */
export const PROTOCOL_MLLP_HEADER = Buffer.from([0x0b]);

/** @internal */
export const PROTOCOL_MLLP_END = Buffer.from([0x1c]);

/** @internal */
export const PROTOCOL_MLLP_FOOTER = Buffer.from([0x0d]);

/** @internal */
export const NAME_FORMAT = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/; //eslint-disable-line

/** @internal */
export const MSA_1_VALUES_v2_1 = ["AA", "AR", "AE"];

/** @internal */
export const MSA_1_VALUES_v2_x = ["CA", "CR", "CE"];

/** @internal */
export type validMSA1 = "AA" | "AR" | "AE" | "CA" | "CR" | "CE";

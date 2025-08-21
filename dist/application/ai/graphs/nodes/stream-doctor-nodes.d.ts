import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StreamDoctorState } from '../types/stream-doctor-state';
export declare function isMetaDataOnly(state: StreamDoctorState, llm: BaseChatModel): Promise<Partial<StreamDoctorState>>;
export declare function getData(state: StreamDoctorState, llm: BaseChatModel): Promise<Partial<StreamDoctorState>>;
export declare function getMetaData(state: StreamDoctorState, llm: BaseChatModel): Promise<Partial<StreamDoctorState>>;
export declare function analyzeData(state: StreamDoctorState, llm: BaseChatModel): Promise<Partial<StreamDoctorState>>;
export declare function response(state: StreamDoctorState, llm: BaseChatModel): Promise<Partial<StreamDoctorState>>;
export declare function shouldEnd(state: StreamDoctorState): "true" | "false";

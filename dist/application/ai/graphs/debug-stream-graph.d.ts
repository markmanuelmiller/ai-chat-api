import { BaseChatModel } from '@langchain/core/language_models/chat_models';
export declare const DebugParamsAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    start: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    end: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    timezone: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    streamType: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    streamStatus: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    streamError: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    streamErrorDescription: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
}>;
export declare const JobDataAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    jobId: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    launcherStatus: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    dbStatus: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    jobOrderStatus: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    systemResourcesStatus: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    report: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
}>;
export declare const LogDataAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    logs: {
        (): import("@langchain/langgraph").LastValue<string[]>;
        (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    errors: {
        (): import("@langchain/langgraph").LastValue<string[]>;
        (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    warnings: {
        (): import("@langchain/langgraph").LastValue<string[]>;
        (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    analysis: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
}>;
export declare const StateAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    chatId: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    message: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    intent: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    chatHistory: {
        (): import("@langchain/langgraph").LastValue<string[]>;
        (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    streamName: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    debugParams: {
        (): import("@langchain/langgraph").LastValue<import("@langchain/langgraph").StateType<{
            start: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            end: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            timezone: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamType: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamStatus: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamError: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamErrorDescription: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>>;
        (annotation: import("@langchain/langgraph").SingleReducer<import("@langchain/langgraph").StateType<{
            start: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            end: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            timezone: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamType: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamStatus: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamError: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamErrorDescription: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>, import("@langchain/langgraph").StateType<{
            start: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            end: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            timezone: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamType: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamStatus: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamError: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamErrorDescription: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>>): import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/langgraph").StateType<{
            start: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            end: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            timezone: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamType: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamStatus: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamError: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamErrorDescription: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>, import("@langchain/langgraph").StateType<{
            start: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            end: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            timezone: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamType: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamStatus: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamError: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
            streamErrorDescription: {
                (): import("@langchain/langgraph").LastValue<string>;
                (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    jobData: import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/langgraph").StateType<{
        jobId: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        launcherStatus: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        dbStatus: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        jobOrderStatus: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        systemResourcesStatus: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        report: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
    }>, import("@langchain/langgraph").StateType<{
        jobId: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        launcherStatus: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        dbStatus: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        jobOrderStatus: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        systemResourcesStatus: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        report: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
    }>>;
    logData: import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/langgraph").StateType<{
        logs: {
            (): import("@langchain/langgraph").LastValue<string[]>;
            (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        errors: {
            (): import("@langchain/langgraph").LastValue<string[]>;
            (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        warnings: {
            (): import("@langchain/langgraph").LastValue<string[]>;
            (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        analysis: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
    }>, import("@langchain/langgraph").StateType<{
        logs: {
            (): import("@langchain/langgraph").LastValue<string[]>;
            (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        errors: {
            (): import("@langchain/langgraph").LastValue<string[]>;
            (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        warnings: {
            (): import("@langchain/langgraph").LastValue<string[]>;
            (annotation: import("@langchain/langgraph").SingleReducer<string[], string[]>): import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
        analysis: {
            (): import("@langchain/langgraph").LastValue<string>;
            (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
            Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
        };
    }>>;
    finalReport: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    streamingMessages: import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
}>;
export declare class DebugStreamGraph {
    private graph;
    private llm;
    private baseUrl;
    private jobGraph;
    private logGraph;
    constructor(llm: BaseChatModel, config: any);
    private buildGraph;
    /**
     * Runs the graph with the given input state
     * @param initialState Initial state for the graph
     * @returns The final state after graph execution
     */
    invoke(initialState: Partial<typeof StateAnnotation.State>): Promise<typeof StateAnnotation.State>;
    /**
     * Streams the graph execution with the given input state
     * @param initialState Initial state for the graph
     * @returns A stream of state updates
     */
    stream(initialState: Partial<typeof StateAnnotation.State>): Promise<AsyncIterable<typeof StateAnnotation.State>>;
}
export declare function createGraph(dependencies: {
    llm: BaseChatModel;
    baseUrl: string;
}): Promise<DebugStreamGraph>;

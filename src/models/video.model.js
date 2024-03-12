import mongoose, {Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoScheme = Schema(
    {
        videoFile: {
            type: String,  //cloudinary url
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        }

    }, 
    {timestamps: true}
)

videoScheme.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoScheme)
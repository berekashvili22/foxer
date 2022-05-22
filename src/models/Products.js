import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true },
        desc: { type: String, required: false },
        img: { type: String, required: true },
        price: { type: Number, required: true },
        categories: { type: Array },
        facets: {
            color: { type: String },
            size: { type: String }
        }
    },
    { timestamps: true }
);

export const Product = mongoose.model('product', ProductSchema);

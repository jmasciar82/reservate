import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  auditId: {
    type: String,
    unique: true,
  },
  pdvCode: {
    type: String,
    required: true,
  },
  povCode: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: String,
  userEmail: String,
  date: {
    type: Date,
    default: Date.now,
  },
  observations: String,
  images: {
    before: [{ type: String }],
    after: [{ type: String }]
  },
  pdfKey: String
}, {
  timestamps: true
});

auditSchema.pre('save', async function (next) {
  if (this.isNew) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    // Find the latest audit for today
    const lastAudit = await this.constructor.findOne({ auditId: new RegExp(`^AUD-${dateStr}-`) }).sort({ auditId: -1 });
    let counter = 1;
    if (lastAudit && lastAudit.auditId) {
      const parts = lastAudit.auditId.split('-');
      counter = parseInt(parts[2], 10) + 1;
    }
    const paddedCounter = counter.toString().padStart(4, '0');
    this.auditId = `AUD-${dateStr}-${paddedCounter}`;
  }
  next();
});

const Audit = mongoose.model('Audit', auditSchema);
export default Audit;

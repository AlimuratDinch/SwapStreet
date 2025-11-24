using backend.Contracts;
using backend.DbContexts;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class TagService : ITagService
    {
        private readonly AppDbContext _db;

        public TagService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Tag?> GetByIdAsync(Guid id)
        {
            return await _db.Tags
                .Include(t => t.ArticleTypeRef)
                .Include(t => t.StyleRef)
                .Include(t => t.SizeRef)
                .Include(t => t.BrandRef)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<IEnumerable<Tag>> GetAllAsync()
        {
            return await _db.Tags
                .Include(t => t.ArticleTypeRef)
                .Include(t => t.StyleRef)
                .Include(t => t.SizeRef)
                .Include(t => t.BrandRef)
                .ToListAsync();
        }

        public async Task<Tag> CreateAsync(Tag tag)
        {
            tag.Id = Guid.NewGuid();
            tag.CreatedAt = DateTime.UtcNow;
            tag.UpdatedAt = DateTime.UtcNow;

            _db.Tags.Add(tag);
            await _db.SaveChangesAsync();
            return tag;
        }

        public async Task<Tag?> UpdateAsync(Guid id, Tag tag)
        {
            var existingTag = await _db.Tags.FindAsync(id);
            if (existingTag == null) return null;

            existingTag.ArticleTypeId = tag.ArticleTypeId;
            existingTag.StyleId = tag.StyleId;
            existingTag.SizeId = tag.SizeId;
            existingTag.Color = tag.Color;
            existingTag.BrandId = tag.BrandId;
            existingTag.Sex = tag.Sex;
            existingTag.Condition = tag.Condition;
            existingTag.Material = tag.Material;
            existingTag.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return existingTag;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var tag = await _db.Tags.FindAsync(id);
            if (tag == null) return false;

            _db.Tags.Remove(tag);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
